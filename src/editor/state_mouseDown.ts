import * as Editor from "./index"
import * as Project from "../project"
import * as Windows from "../windows"
import Rational from "../util/rational"
import Rect from "../util/rect"


export function mouseDown(data: Editor.EditorUpdateData, rightButton: boolean)
{
    if (data.state.mouse.down)
        return
            
    const prevDownDate = data.state.mouse.downDate

    data.state.mouse.down = true
    data.state.mouse.downDate = new Date()
    data.state.mouse.action = Editor.EditorAction.None

    const selectMultiple = data.state.keysDown.has(data.prefs.editor.keySelectMultiple)
    const selectRange = data.state.keysDown.has(data.prefs.editor.keySelectRange)
    const forcePan = data.state.keysDown.has(data.prefs.editor.keyPan)
    const doubleClick =
        data.state.mouse.downDate.getTime() - prevDownDate.getTime() <
        data.prefs.editor.mouseDoubleClickThresholdMs

    data.state.drag =
    {
        origin:
        {
            point: { ...data.state.mouse.point },
            range: null,
            timeScroll: data.state.timeScroll,
            trackScroll: data.state.trackScroll,
            trackYScroll: data.state.tracks[data.state.mouse.point.trackIndex].yScroll,
            project: data.project,
        },

        xLocked: true,
        yLocked: true,
        posDelta: { x: 0, y: 0 },
        timeDelta: new Rational(0),
        rowDelta: 0,
        trackDelta: 0,
        trackInsertionBefore: -1,

        elemId: -1,
        notePreviewLast: null,
    }

    function withTrackAtMouse<T>(fn: (track: Editor.EditorTrack) => T | null)
    {
        for (let t = 0; t < data.state.tracks.length; t++)
        {
            if (t == data.state.mouse.point.trackIndex)
                return fn(data.state.tracks[t])
        }

        return null
    }

    const trackAtMouseNoCursor = !!withTrackAtMouse(tr => tr.noCursor)

    if (rightButton || forcePan)
    {
        data.state.mouse.action = Editor.EditorAction.Pan
    }
    else if (data.state.mouse.point.pos.x > data.state.trackHeaderW &&
        (data.state.keysDown.has(data.prefs.editor.keyPencil) || trackAtMouseNoCursor))
    {
        if (!trackAtMouseNoCursor)
        {
            Editor.selectionClear(data)
            data.state.cursor.visible = false
        }

        data.state.mouse.action = Editor.EditorAction.Pencil
        withTrackAtMouse(tr => tr.pencilStart(data))
    }
    else if (data.state.hover)
    {
        Editor.keyHandlePendingFinish(data)

        const elem = data.project.elems.get(data.state.hover.id)
        data.state.drag.elemId = data.state.hover.id

        Editor.selectionToggleHover(data, data.state.hover, selectMultiple)
        data.state.cursor.visible = false

        if (elem && elem.type == "track")
        {
            if (!selectRange)
            {
                data.state.rangeSelectOriginTrackIndex = data.state.mouse.point.trackIndex
                if (data.state.hoverControl != Editor.TrackControl.None)
                {
                    data.state.mouse.action = Editor.EditorAction.DragTrackControl
                }
            }
            else if (data.state.rangeSelectOriginTrackIndex >= 0)
            {
                selectTrackRange(data,
                    data.state.rangeSelectOriginTrackIndex,
                    data.state.mouse.point.trackIndex)
            }
        }
        else
        {
            data.state.rangeSelectOriginTrackIndex = -1

            withTrackAtMouse(tr => tr.click(data, data.state.hover!.id))

            const range = Editor.selectionRange(data)
            if (range)
            {
                Editor.cursorSetTime(data, range.start, range.start)
                Editor.cursorSetTrack(data, data.state.mouse.point.trackIndex, data.state.mouse.point.trackIndex)
                data.playback.setStartTime(range.start)
            }
            
            if (doubleClick)
            {
                withTrackAtMouse(tr => tr.doubleClick(data, data.state.hover!.id))
            }
        }
    }
    else
    {
        Editor.keyHandlePendingFinish(data)

        if (!selectMultiple)
            Editor.selectionClear(data)

        if (data.state.mouse.point.pos.x > data.state.trackHeaderW)
        {
            data.state.mouse.action = Editor.EditorAction.SelectCursor
            data.state.cursor.visible = true
            data.state.cursor.time1 = data.state.cursor.time2 =
                data.state.mouse.point.time
            data.state.cursor.trackIndex1 = data.state.cursor.trackIndex2 =
                data.state.mouse.point.trackIndex

            if (doubleClick)
            {
                const anchor = Editor.findPreviousAnchor(
                    data, data.state.mouse.point.time,
                    data.state.mouse.point.trackIndex, data.state.mouse.point.trackIndex)
                    
                data.state.cursor.time1 = data.state.cursor.time2 = anchor
            }

            data.playback.setStartTime(data.state.cursor.time1)
        }
    }
}


function selectTrackRange(
    data: Editor.EditorUpdateData,
    trackIndex1: number,
    trackIndex2: number)
{
    const trackIndexMin = Math.min(trackIndex1, trackIndex2)
    const trackIndexMax = Math.max(trackIndex1, trackIndex2)

    Editor.selectionClear(data)

    for (var i = trackIndexMin; i <= trackIndexMax; i++)
        Editor.selectionAdd(data, data.state.tracks[i].projectTrackId)
}