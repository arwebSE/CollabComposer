import React from "react"
import * as Dockable from "./index"
import * as DockableData from "./state"
import { WindowContext } from "./windowContext"
import * as Prefs from "../prefs"
import Rect from "../util/rect"
import styled from "styled-components"
import { useRefState } from "../util/refState"


const StyledCloseButton = styled.button`
    pointer-events: auto;
    color: #fff;
    border: 1px solid #888;
    border-radius: 0.5em;
    background-color: #2f3136;
    padding: 0.1em 0.3em;
    cursor: pointer;
    margin-left: 0.25em;
    width: 1.5em;

    &:hover
    {
        border: 1px solid #fff;
    }

    &:active
    {
        border: 1px solid #fff;
        background-color: #000;
    }
`


export function Container()
{
    const dockable = Dockable.useDockable()

    const [rect, setRect] = React.useState(new Rect(0, 0, 0, 0))
    const rootRef = React.useRef<HTMLDivElement>(null)


    React.useLayoutEffect(() =>
    {
        const onResize = () =>
        {
            if (!rootRef.current)
                return
    
            const elemRect = rootRef.current!.getBoundingClientRect()

            setRect(new Rect(
                elemRect.x,
                elemRect.y,
                elemRect.width,
                elemRect.height))
        }

        onResize()

        window.addEventListener("resize", onResize)
        return () => window.removeEventListener("resize", onResize)

    }, [])


    const layoutRef = React.useRef<Dockable.Layout>(null!)
    const rectRef = React.useRef<Rect>(null!)
    rectRef.current = rect
    layoutRef.current = React.useMemo(() =>
    {
        return DockableData.getLayout(dockable.ref.current.state, rect)

    }, [rect, dockable.update])


    React.useEffect(() =>
    {
        const onRefreshPreferredSize = () =>
        {
            for (const panel of dockable.ref.current.state.floatingPanels)
            {
                if (!panel.justOpened)
                    continue
                
                panel.justOpened = false
                panel.rect.w = panel.preferredFloatingSize.w
                panel.rect.h = panel.preferredFloatingSize.h

                switch (panel.justOpenedAnchorAlignX)
                {
                    case 0:
                        panel.rect.x = panel.justOpenedAnchorRect.xCenter - panel.rect.w / 2
                        break
                    case 1:
                        panel.rect.x = panel.justOpenedAnchorRect.x2
                        break
                    case -1:
                        panel.rect.x = panel.justOpenedAnchorRect.x1 - panel.rect.w
                        break
                }
                
                switch (panel.justOpenedAnchorAlignY)
                {
                    case 0:
                        panel.rect.y = panel.justOpenedAnchorRect.yCenter - panel.rect.h / 2
                        break
                    case 1:
                        panel.rect.y = panel.justOpenedAnchorRect.y2
                        break
                    case -1:
                        panel.rect.y = panel.justOpenedAnchorRect.y1 - panel.rect.h
                        break
                }

                Dockable.clampFloatingPanelStrictly(dockable.ref.current.state, panel, rectRef.current)
                dockable.commit()
            }
        }

        window.addEventListener("dockableRefreshPreferredSize", onRefreshPreferredSize)
        return () => window.removeEventListener("dockableRefreshPreferredSize", onRefreshPreferredSize)

    }, [])

    
    const mouseData = useMouseHandler(layoutRef, rectRef)

    const anchorSize = 5
    const anchorColor = Prefs.global.ui.windowAnchorColor

    return <div
        ref={ rootRef }
        style={{
            width: "100%",
            height: "100%",
            backgroundColor: Prefs.global.ui.windowVoidColor,
    }}>

        { layoutRef.current.panelRects.map(panelRect =>
            <Panel
                key={ panelRect.panel.id }
                panelRect={ panelRect }
                mouseHandler={ mouseData }
            />
        )}

        { layoutRef.current.dividers.map(divider =>
            <div
                onMouseDown={ ((ev: MouseEvent) => mouseData.onDividerResize(ev, divider)) as any }
                style={{
                    width: (divider.rect.w || 6) + "px",
                    height: (divider.rect.h || 6) + "px",

                    position: "absolute",
                    left: (divider.rect.x - 3) + "px",
                    top: (divider.rect.y - 3) + "px",

                    cursor: !divider.vertical ?
                        "ew-resize" :
                        "ns-resize",

                    zIndex: 1,
            }}/>
        )}

        { !mouseData.showAnchors || !mouseData.draggingAnchor ? null :
            <div style={{
                position: "absolute",
                left: (mouseData.draggingAnchor.previewRect.x1) + "px",
                top: (mouseData.draggingAnchor.previewRect.y1) + "px",
                width: (mouseData.draggingAnchor.previewRect.x2 - mouseData.draggingAnchor.previewRect.x1 - 1) + "px",
                height: (mouseData.draggingAnchor.previewRect.y2 - mouseData.draggingAnchor.previewRect.y1 - 1) + "px",

                backgroundColor: Prefs.global.ui.windowOverlayColor,
                zIndex: 1000,
            }}/>
        }

        { !mouseData.showAnchors ? null : layoutRef.current.anchors.map((anchor, i) =>
            anchor.panel == mouseData.grabbedPanel ? null :
                <div key={ i } style={{
                    position: "absolute",
                    left: (anchor.x - anchorSize) + "px",
                    top: (anchor.y - anchorSize) + "px",
                    width: "0px",
                    height: "0px",

                    borderTop: (anchorSize) + "px solid " + (anchor.mode == DockableData.DockMode.Bottom || anchor.mode == DockableData.DockMode.Full ? anchorColor : "transparent"), 
                    borderBottom: (anchorSize) + "px solid " + (anchor.mode == DockableData.DockMode.Top || anchor.mode == DockableData.DockMode.Full ? anchorColor : "transparent"), 
                    borderLeft: (anchorSize) + "px solid " + (anchor.mode == DockableData.DockMode.Right || anchor.mode == DockableData.DockMode.Full ? anchorColor : "transparent"), 
                    borderRight: (anchorSize) + "px solid " + (anchor.mode == DockableData.DockMode.Left || anchor.mode == DockableData.DockMode.Full ? anchorColor : "transparent"), 
                    zIndex: 1001,
                }}/>
        )}

        {/*<div ref={ rootRef } style={{
            position: "relative",
            top: "0px",
            left: "0px",
            width: "100%",
            height: "100%",
            cursor: mouseData.cursor,
            pointerEvents: mouseData.blockEvents ? "auto" : "none",
        }}/>*/}

    </div>
}


interface PrefsProps
{
    readonly prefs: Prefs.Prefs
}


const DivPanel = styled.div<PrefsProps>`
    border: 1px solid ${ props => props.prefs.ui.windowVoidColor };

    &.active
    {
        border: 1px solid ${ props => props.prefs.ui.windowActiveBorderColor };
    }
`


function Panel(props: any)
{
    const dockable = Dockable.useDockable()
    const panelRect: DockableData.PanelRect = props.panelRect
    const mouseHandler: MouseHandlerData = props.mouseHandler

    const resizeHandleSize = 20

    return <div key={ panelRect.panel.id } style={{
        position: "absolute",
        left: (panelRect.rect.x) + "px",
        top: (panelRect.rect.y) + "px",
        width: (panelRect.rect.w) + "px",
        height: (panelRect.rect.h) + "px",
        boxSizing: "border-box",

        backgroundColor: Prefs.global.ui.windowVoidColor,
        borderRadius: "0.5em",
        padding: "0.25em",

        zIndex: panelRect.panel.floating ? 100 : 0,
    }}>
        <DivPanel
            className={ dockable.ref.current.state.activePanel === panelRect.panel ? "active" : undefined }
            onMouseDown={ ((ev: MouseEvent) => mouseHandler.onPanelActivate(ev, panelRect.panel)) as any }
            prefs={ Prefs.global }
            style={{
                backgroundColor: Prefs.global.ui.windowPanelColor,
                borderRadius: "0.5em",
                boxSizing: "border-box",
                width: "100%",
                height: "100%",
                
                display: "grid",
                gridTemplate: "auto 1fr / 1fr",
                overflow: "hidden",
        }}>
            <div
                onMouseDown={ ((ev: MouseEvent) => mouseHandler.onPanelHeaderMouseDown(ev, panelRect.panel)) as any }
                style={{
                    backgroundColor: Prefs.global.ui.windowVoidColor,
                    textAlign: "left",
                    gridRow: 1,
                    gridColumn: 1,
            }}>

                { panelRect.panel.windowIds.map((cId, idx) =>
                    <div
                        key={ cId }
                        onMouseDown={ ((ev: MouseEvent) => mouseHandler.onPanelTabMouseDown(ev, panelRect.panel, idx)) as any }
                        onContextMenu={ ev => ev.preventDefault() }
                        style={{
                            display: "inline-block",
                            backgroundColor: panelRect.panel.curWindowIndex == idx ?
                                Prefs.global.ui.windowPanelColor :
                                Prefs.global.ui.windowVoidColor,
                            color: "#fff",
                            padding: "0.25em 0.5em",
                            marginRight: "0.25em",
                            userSelect: "none",
                            borderTopRightRadius: "0.5em",
                            borderTopLeftRadius: "0.5em",
                    }}>
                        { panelRect.panel.windowTitles[idx] || "New Window" }
                        <StyledCloseButton
                            onClick={ ((ev: MouseEvent) => mouseHandler.onPanelTabClose(ev, panelRect.panel, idx)) as any }
                        >
                            x
                        </StyledCloseButton>
                    </div>
                )}

            </div>

            { panelRect.panel.windowIds.map((cId, idx) =>
            {
                const component = !dockable.ref.current.contentIdToComponent ? null :
                    dockable.ref.current.contentIdToComponent(cId)

                const data = !dockable.ref.current.contentIdToData ? null :
                    dockable.ref.current.contentIdToData(cId)

                const setTitle = (title: string) =>
                {
                    if (panelRect.panel.windowTitles[idx] != title)
                    {
                        window.requestAnimationFrame(() =>
                        {
                            panelRect.panel.windowTitles[idx] = title
                            dockable.commit()
                        })
                    }
                }

                const setPreferredSize = (w: number, h: number) =>
                {
                    if (idx == panelRect.panel.curWindowIndex &&
                        (w != panelRect.panel.preferredFloatingSize.w ||
                        h != panelRect.panel.preferredFloatingSize.h))
                    {
                        window.requestAnimationFrame(() =>
                        {
                            panelRect.panel.preferredFloatingSize = new Rect(0, 0, w, h)
                            dockable.commit()

                            if (panelRect.panel.justOpened)
                                window.dispatchEvent(new Event("dockableRefreshPreferredSize"))
                        })
                    }
                }

                return <WindowContext.Provider key={ cId } value={{
                    panel: panelRect.panel,
                    contentId: cId,
                    data,

                    setTitle,
                    setPreferredSize,
                }}>
                    <div style={{
                        display: panelRect.panel.curWindowIndex == idx ? "block" : "none",
                        color: "#fff",
                        width: "100%",
                        height: "100%",
                        minWidth: "0px",
                        minHeight: "0px",
                        textAlign: "left",
                        gridRow: 2,
                        gridColumn: 1,
                    }}>
                        { !component ? null : React.createElement(component, {
                            key: cId,
                            contentId: cId,
                            rect: panelRect,
                        })}
                    </div>
                </WindowContext.Provider>
            })}

            { !panelRect.panel.floating ? null : 
                <div
                    onMouseDown={ ((ev: MouseEvent) => mouseHandler.onPanelResize(ev, panelRect.panel)) as any }
                    style={{
                        width: resizeHandleSize + "px",
                        height: resizeHandleSize + "px",

                        gridRow: "1 / 3",
                        gridColumn: 1,
                        alignSelf: "end",
                        justifySelf: "end",

                        cursor: "nwse-resize",
                        zIndex: 1,
                }}/>
            }

        </DivPanel>

    </div>
}


interface MouseHandlerState
{
    mouseDown: boolean
    mouseDownPos: MousePos
    mouseAction: MouseAction
    mousePos: MousePos
    mouseDragLocked: boolean

    grabbedPanel: Dockable.Panel | null
    grabbedTab: number | null
    grabbedDivider: Dockable.Divider | null
    nearestAnchor: Dockable.Anchor | null
}


enum MouseAction
{
    None,
    MoveHeader,
    ResizePanel,
    ResizeDivider,
}


interface MousePos
{
    x: number
    y: number
}


interface MouseHandlerData
{
    grabbedPanel: Dockable.Panel | null
    showAnchors: boolean
    draggingAnchor: Dockable.Anchor | null
    onPanelActivate: (ev: MouseEvent, panel: Dockable.Panel) => void
    onPanelHeaderMouseDown: (ev: MouseEvent, panel: Dockable.Panel) => void
    onPanelTabMouseDown: (ev: MouseEvent, panel: Dockable.Panel, tab: number) => void
    onPanelResize: (ev: MouseEvent, panel: Dockable.Panel) => void
    onDividerResize: (ev: MouseEvent, divider: Dockable.Divider) => void
    onPanelTabClose: (ev: MouseEvent, panel: Dockable.Panel, tab: number) => void
}


function useMouseHandler(
    layoutRef: React.MutableRefObject<Dockable.Layout>,
    rectRef: React.MutableRefObject<Rect>)
    : MouseHandlerData
{
    const dockableRef = Dockable.useDockable()

    const stateRef = useRefState<MouseHandlerState>(() =>
    {
        return {
            mouseDown: false,
            mouseDownPos: { x: 0, y: 0 },
            mouseAction: MouseAction.None,
            mousePos: { x: 0, y: 0 },
            mouseDragLocked: true,

            grabbedPanel: null,
            grabbedTab: null,
            grabbedDivider: null,
            nearestAnchor: null,
        }
    })

    const transformMouse = (ev: MouseEvent): MousePos =>
    {
        return {
            x: ev.pageX,
            y: ev.pageY,
        }
    }

    const bringToFront = (ev: any, panel: Dockable.Panel) =>
    {
        const dockable = dockableRef.ref.current.state
        if (panel.windowIds.length != 0)
            dockable.activePanel = panel

        if (!panel.floating)
        {
            dockableRef.commit()
            return
        }

        if (dockable.floatingPanels.some(p => p.bugfixAppearOnTop))
        {
            dockable.floatingPanels.forEach(p => p.bugfixAppearOnTop = false)
            return
        }

        dockable.floatingPanels = dockable.floatingPanels.filter(p => p !== panel)
        dockable.floatingPanels.push(panel)
        
        console.log("bringToFront", panel, ev.clickedEphemeral)
        if (!panel.ephemeral && !ev.clickedEphemeral)
            Dockable.removeEphemerals(dockable)
     
        dockableRef.commit()
    }
    
    React.useEffect(() =>
    {
        const onMouseMove = (ev: MouseEvent) =>
        {
            const dockable = dockableRef.ref.current.state
            const state = stateRef.ref.current
            const mousePosPrev = state.mousePos
            state.mousePos = transformMouse(ev)

            if (state.mouseDown)
            {
                ev.preventDefault()

                if (state.mouseAction == MouseAction.ResizePanel)
                {
                    state.grabbedPanel!.rect.w += state.mousePos.x - mousePosPrev.x
                    state.grabbedPanel!.rect.h += state.mousePos.y - mousePosPrev.y
                }
                else if (state.mouseAction == MouseAction.ResizeDivider)
                {
                    const divider = state.grabbedDivider!
                    divider.panel.splitSize = Math.max(0.05, Math.min(0.95,
                        ((divider.vertical ? state.mousePos.y : state.mousePos.x) - divider.resizeMin) /
                        (divider.resizeMax - divider.resizeMin)
                    ))
                }
                else if (state.mouseDragLocked)
                {
                    if (Math.abs(state.mousePos.x - state.mouseDownPos.x) > 10 ||
                        Math.abs(state.mousePos.y - state.mouseDownPos.y) > 10)
                    {
                        state.mouseDragLocked = false

                        if (state.mouseAction == MouseAction.MoveHeader)
                        {
                            if (state.grabbedTab === null || state.grabbedPanel!.windowIds.length == 1)
                            {
                                if (!state.grabbedPanel!.floating)
                                {
                                    const windows = [...state.grabbedPanel!.windowIds]
                                    for (const window of windows)
                                        Dockable.removeWindow(dockable, state.grabbedPanel!, window)
                                    
                                    state.grabbedPanel = Dockable.makePanel(dockable)
                                    for (const window of windows)
                                        Dockable.addWindow(dockable, state.grabbedPanel, window)

                                    Dockable.coallesceEmptyPanels(dockable)
                                        
                                    state.grabbedPanel!.rect = new Rect(state.mousePos.x, state.mousePos.y, 0, 0)
                                    state.grabbedPanel!.justOpenedAnchorRect = new Rect(state.mousePos.x, state.mousePos.y, 0, 0)
                                    state.grabbedPanel!.justOpenedAnchorAlignX = 0
                                    state.grabbedPanel!.justOpenedAnchorAlignY = 1
                                }
                            }
                            else
                            {
                                const window = state.grabbedPanel!.windowIds[state.grabbedTab]
                                Dockable.removeWindow(dockable, state.grabbedPanel!, window)
                                state.grabbedPanel = Dockable.makePanel(dockable)
                                Dockable.addWindow(dockable, state.grabbedPanel, window)
                                Dockable.coallesceEmptyPanels(dockable)

                                state.grabbedPanel!.rect = new Rect(state.mousePos.x, state.mousePos.y, 0, 0)
                                state.grabbedPanel!.justOpenedAnchorRect = new Rect(state.mousePos.x, state.mousePos.y, 0, 0)
                                state.grabbedPanel!.justOpenedAnchorAlignX = 0
                                state.grabbedPanel!.justOpenedAnchorAlignY = 1
                            }

                            bringToFront(ev, state.grabbedPanel!)
                        }
                    }
                }
                else
                {
                    if (state.mouseAction == MouseAction.MoveHeader)
                    {
                        let nearestDistSqr = 50 * 50
                        state.nearestAnchor = null
        
                        for (const anchor of layoutRef.current!.anchors)
                        {
                            const xx = anchor.x - state.mousePos.x
                            const yy = anchor.y - state.mousePos.y
                            const distSqr = xx * xx + yy * yy
                            if (distSqr < nearestDistSqr)
                            {
                                nearestDistSqr = distSqr
                                state.nearestAnchor = anchor
                            }
                        }
        
                        state.grabbedPanel!.rect = state.grabbedPanel!.rect.displace(
                            state.mousePos.x - mousePosPrev.x,
                            state.mousePos.y - mousePosPrev.y)
                    }
                }
            }

            stateRef.commit()
            dockableRef.commit()
        }

        const onMouseUp = (ev: MouseEvent) =>
        {
            const state = stateRef.ref.current
            const dockable = dockableRef.ref.current.state

            if (state.mouseDown && !state.mouseDragLocked)
            {
                if (state.mouseAction == MouseAction.MoveHeader &&
                    state.nearestAnchor)
                {
                    Dockable.dock(
                        dockable,
                        state.grabbedPanel!,
                        state.nearestAnchor.panel,
                        state.nearestAnchor.mode)
                }

                Dockable.clampFloatingPanels(dockable, rectRef.current)
            }

            state.mouseDown = false
            state.mouseAction = MouseAction.None
            stateRef.commit()
            dockableRef.commit()
        }

        window.addEventListener("mousemove", onMouseMove)
        window.addEventListener("mouseup", onMouseUp)

        return () =>
        {
            window.removeEventListener("mousemove", onMouseMove)
            window.removeEventListener("mouseup", onMouseUp)
        }

    }, [])

    const onPanelActivate = (ev: MouseEvent, panel: Dockable.Panel) =>
    {
        if (panel.ephemeral)
        {
            (ev as any).clickedEphemeral = true
        }

        bringToFront(ev, panel)
    }

    const onPanelHeaderMouseDown = (ev: MouseEvent, panel: Dockable.Panel) =>
    {
        ev.preventDefault()
        const state = stateRef.ref.current
        state.grabbedPanel = panel
        state.grabbedTab = null
        state.mouseDown = true
        state.mouseAction = MouseAction.MoveHeader
        state.mouseDownPos = state.mousePos = transformMouse(ev)
        state.mouseDragLocked = true
        stateRef.commit()

        bringToFront(ev, panel)
    }

    const onPanelTabMouseDown = (ev: MouseEvent, panel: Dockable.Panel, tab: number) =>
    {
        ev.preventDefault()
        ev.stopPropagation()
        panel.curWindowIndex = tab
        const state = stateRef.ref.current
        state.grabbedPanel = panel
        state.grabbedTab = tab
        state.mouseDown = true
        state.mouseAction = MouseAction.MoveHeader
        state.mouseDownPos = state.mousePos = transformMouse(ev)
        state.mouseDragLocked = true
        stateRef.commit()
        dockableRef.commit()

        bringToFront(ev, panel)
    }

    const onPanelResize = (ev: MouseEvent, panel: Dockable.Panel) =>
    {
        ev.preventDefault()
        const state = stateRef.ref.current
        state.grabbedPanel = panel
        state.grabbedTab = null
        state.mouseDown = true
        state.mouseAction = MouseAction.ResizePanel
        state.mouseDownPos = state.mousePos = transformMouse(ev)
        state.mouseDragLocked = true
        stateRef.commit()

        bringToFront(ev, panel)
    }

    const onDividerResize = (ev: MouseEvent, divider: Dockable.Divider) =>
    {
        ev.preventDefault()
        const state = stateRef.ref.current
        state.grabbedDivider = divider
        state.mouseDown = true
        state.mouseAction = MouseAction.ResizeDivider
        state.mouseDownPos = state.mousePos = transformMouse(ev)
        state.mouseDragLocked = true
        stateRef.commit()
    }

    const onPanelTabClose = (ev: MouseEvent, panel: Dockable.Panel, tab: number) =>
    {
        ev.preventDefault()
        const dockable = dockableRef.ref.current.state
        const window = panel.windowIds[tab]
        Dockable.removeWindow(dockable, panel, window)
        Dockable.coallesceEmptyPanels(dockable)
        dockableRef.commit()
    }

    return {
        grabbedPanel: stateRef.ref.current.mouseDown ?
            stateRef.ref.current.grabbedPanel :
            null,

        showAnchors:
            stateRef.ref.current.mouseDown &&
            !stateRef.ref.current.mouseDragLocked &&
            stateRef.ref.current.mouseAction == MouseAction.MoveHeader,

        draggingAnchor: stateRef.ref.current.nearestAnchor,
        onPanelActivate,
        onPanelHeaderMouseDown,
        onPanelTabMouseDown,
        onPanelResize,
        onDividerResize,
        onPanelTabClose,
    }
}