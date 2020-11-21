import React from "react"
import * as Windows from "./index"
import * as Dockable from "../dockable"
import * as Project from "../project"
import * as UI from "../ui"
import styled from "styled-components"


const StyledButton = styled.button`
    font-family: inherit;
    color: #fff;
    border: 1px solid #888;
    border-radius: 0.25em;
    background-color: transparent;
    padding: 0.5em 1em;
    margin: 0.5em 0.25em;
    cursor: pointer;
    outline: none;

    &:hover
    {
        background-color: #2f3136;
        border: 1px solid #fff;
    }

    &:active
    {
        background-color: #222;
        border: 1px solid #fff;
    }
`


export function TrackSettings()
{
    const windowCtx = Dockable.useWindow()
    windowCtx.setPreferredSize(500, 350)

    const dockable = Dockable.useDockable()
    const project = Project.useProject()

    const trackId: Project.ID = windowCtx.data.trackId
    
    const getTrack = () =>
    {
        const elem = project.ref.current.elems.get(trackId)
        if (!elem || elem.type != Project.ElementType.Track)
            return null

        return elem as Project.Track
    }

    const track = getTrack()
    if (!track)
        return null
    
    windowCtx.setTitle("Track [" + track.name + "]")

    const onRename = (newName: string) =>
    {
        const newTrack: Project.Track = {
            ...track,
            name: newName,
        }

        project.ref.current = Project.upsertTrack(project.ref.current, newTrack)
        project.commit()
    }

    const onAddInstrument = () =>
    {
        const newTrack: Project.Track = {
            ...track,
            instruments: [
                ...track.instruments,
                Project.makeInstrument(),
            ],
        }

        project.ref.current = Project.upsertTrack(project.ref.current, newTrack)
        project.commit()
    }

    const onRemoveInstrument = (index: number) =>
    {
        const newTrack: Project.Track = {
            ...track,
            instruments: [
                ...track.instruments.slice(0, index),
                ...track.instruments.slice(index + 1),
            ],
        }

        project.ref.current = Project.upsertTrack(project.ref.current, newTrack)
        project.commit()
    }

    const onEditInstrument = (index: number) =>
    {
        const getInstrument = () =>
        {
            const track = getTrack()
            if (!track || index >= track.instruments.length)
                return null

            return track.instruments[index]
        }

        const setInstrument = (newInstrument: Project.Instrument) =>
        {
            const track = getTrack()
            if (!track)
                return null

            const newTrack: Project.Track = {
                ...track,
                instruments: [
                    ...track.instruments.slice(0, index),
                    newInstrument,
                    ...track.instruments.slice(index + 1),
                ],
            }
    
            project.ref.current = Project.upsertTrack(project.ref.current, newTrack)
            project.commit()
        }

        dockable.ref.current.createFloating(
            Windows.InstrumentSelect,
            { getInstrument, setInstrument })
    }

    return <div style={{
        width: "100%",
        height: "100%",
        boxSizing: "border-box",
        padding: "0.5em",

        display: "grid",
        gridTemplate: "auto auto 1fr / 1fr",
        justifyContent: "start",
        justifyItems: "start",
    }}>
        <div>
            Name:
            <UI.Input
                value={ track.name }
                onChange={ onRename }
            />
        </div>

        <br/>

        <div>
            Instruments:

            { track.instruments.map((instr, i) =>
                <div>
                    <StyledButton
                        onClick={ () => onRemoveInstrument(i) }
                    >
                        x
                    </StyledButton>
                    { "  " }
                    <StyledButton
                        onClick={ () => onEditInstrument(i) }
                    >
                        { Project.instrumentName(instr) }
                    </StyledButton>
                </div>
            )}

            <div>
                <StyledButton
                    onClick={ onAddInstrument }
                >
                    +
                </StyledButton>
            </div>
        </div>
    </div>
}