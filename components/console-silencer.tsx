"use client"

import { useEffect } from "react"

export function ConsoleSilencer() {
    useEffect(() => {
        if (process.env.NODE_ENV === "production") {
            const emptyFunc = () => { }
            console.log = emptyFunc
            console.debug = emptyFunc
            console.info = emptyFunc
            console.warn = emptyFunc
            // We explicitly do NOT suppress console.error to ensure runtime crashes are still visible in monitoring
        }
    }, [])

    return null
}
