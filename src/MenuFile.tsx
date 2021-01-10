import React from "react"
import * as Project from "./project"
import * as Menubar from "./menubar"
import * as Popup from "./popup"
import * as Playback from "./playback"
import { Input } from "./ui"


export default function MenuFile()
{
    const project = Project.useProject()
    const playback = Playback.usePlayback()


    React.useEffect(() =>
    {
        const onOpenFileChange = (ev: Event) =>
        {
            const elem = ev.target as HTMLInputElement

            if (elem.files!.length != 1)
                return
            
            let reader = new FileReader()
            reader.readAsArrayBuffer(elem.files![0])
            reader.onload = () =>
            {
                const bytes = new Uint8Array(reader.result as any)
    
                if (elem.files![0].name.endsWith(".mid"))
                    project.ref.current.project = Project.midiImport(bytes)
                else if (elem.files![0].name.endsWith(".json"))
                {
                    const text = new TextDecoder("utf-8").decode(bytes)
                    const json = JSON.parse(text)
                    project.ref.current.project = Project.jsonImport(json)
                }

                playback.ref.current.stopPlaying()
                project.ref.current.clearUndoStack()
                project.commit()
                window.dispatchEvent(new Event("timelineReset"))
            }
        }
    
        const input = document.getElementById("inputOpenFile") as HTMLInputElement
        input!.addEventListener("change", onOpenFileChange)

        return () =>
        {
            input!.removeEventListener("change", onOpenFileChange)
        }

    }, [])


    const onNew = () =>
    {
        project.ref.current.setNew()
        playback.ref.current.stopPlaying()
    }

    const onOpen = () =>
    {
        document.getElementById("inputOpenFile")!.click()
    }

    const onJsonDownload = () =>
    {
        const jsonStr = Project.jsonExport(project.ref.current.project)

        const element = document.createElement("a")
        element.setAttribute("href", "data:text/json;charset=utf-8," + encodeURIComponent(jsonStr))
        element.setAttribute("download", "song.json")
    
        element.style.display = "none"
        document.body.appendChild(element)
        element.click()
        document.body.removeChild(element)
    }

    const onJsonPreview = () =>
    {
        const jsonStr = Project.jsonExport(project.ref.current.project)

        const newWindow = window.open()!
        newWindow.document.write("<code style='white-space:pre'>")
        newWindow.document.write(jsonStr)
        newWindow.document.write("</code>")
    }


    return <>
        <Menubar.Item label="File">
            <Popup.Root>
                <Popup.Button
                    icon="📄"
                    label="New"
                    onClick={ onNew }
                />
                <Popup.Button
                    icon="📂"
                    label="Open..."
                    onClick={ onOpen }
                />
                <Popup.Divider/>
                <Popup.Button
                    icon="💾"
                    label="Save"
                    onClick={ onOpen }
                />
                <Popup.Button
                    icon="💾"
                    label="Save As..."
                    onClick={ onOpen }
                />
                <Popup.Button
                    icon="📥"
                    label="Download as JSON"
                    onClick={ onJsonDownload }
                />
                <Popup.Button
                    icon="📥"
                    label="Preview as JSON"
                    onClick={ onJsonPreview }
                />
            </Popup.Root>
        </Menubar.Item>

        <input
            id="inputOpenFile"
            type="file"
            accept=".mid,.json,.txt"
            style={{
                display: "none",
        }}/>
    </>
}