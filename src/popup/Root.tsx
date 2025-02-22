import React from "react"
import Rect from "../util/rect"
import { PopupRootContext, usePopup } from "./popupContext"


interface PopupRootProps
{
    rect?: Rect
    isSub?: boolean
    popupElem?: any
    popupProps?: any
    children?: any
}


export function Root(props: PopupRootProps)
{
    const popupCtx = usePopup()
    const rect = props.rect ?? popupCtx.ref.current.rect
    const [subOpen, setSubOpen] = React.useState<any>(null)
    
    const dismiss = (ev: any) =>
    {
        popupCtx.ref.current.elem = null
        popupCtx.commit()
    }

    React.useEffect(() =>
    {
        const onClickVoid = (ev: MouseEvent) =>
        {
            dismiss(ev)
        }

        window.addEventListener("mousedown", onClickVoid)
        return () =>
        {
            window.removeEventListener("mousedown", onClickVoid)
        }
    })

    return <PopupRootContext.Provider value={{
        curSubPopup: subOpen,
        openSubPopup: setSubOpen,
        itemIndex: 1,
    }}>
        <div
            onMouseDown={ ev => ev.stopPropagation() }
            style={{
                zIndex: 100001,
                position: "absolute",
                left: props.isSub ? rect.x2 : rect.x1,
                top: props.isSub ? rect.y1 :rect.y2,

                backgroundColor: "#2f3136",
                border: "1px solid #fff",
                borderRadius: "0.5em",
                overflow: "hidden",
                boxShadow: "0 0.5em 0.5em 0.5em #0004",

                textAlign: "left",

                display: "grid",
                gridTemplate: "auto / auto auto auto",
                gridAutoFlow: "row",
                pointerEvents: "auto",
        }}>
            { props.children }
        </div>
    </PopupRootContext.Provider>
}