
![Logo](https://i.ibb.co/0F1Pfxb/image.png)


# Mention Tool Plugin for Editor.js
## Demo

https://mention-tool-editorjs.vercel.app/


## Installation

Install with npm

```bash
  npm install editorjs-mention-tool
```
    
## Usage/Examples

```javascript
// Here Import react with useEffect
import React, { useEffect } from 'react'

// Here EditorJS with some plugins
import { createReactEditorJS } from 'react-editor-js'
import Header from "@editorjs/header"
import Paragraph from '@editorjs/paragraph'

// Here mention module
import MentionTool from 'editorjs-mention-tool'
import "editorjs-mention-tool/src/styles.css"



const CustomEditor = () => {

    const editorCore = React.useRef(null)

    const handleInitialize = React.useCallback((instance) => {
        editorCore.current = instance
    }, [])
    
    const ReactEditorJS = createReactEditorJS() // Initialize editor

    const EDITOR_JS_TOOLS = {
        paragraph: {
            class: Paragraph,
            inlineToolbar: true,
        },
        header: Header,
    }

    useEffect(() => {

        // Here create new MentionTool with $ accessor key to use it as variable layout
        new MentionTool({
            holder: 'editorHolder', // This is the editor Holder ( see below )
            accessKey: "$", // Access key ( $ or @ )
            allUsers: [ // The array with the data you want to show when the users type $
                {
                    "id": "1234",
                    "name": "Variable 1",
                    "slug": "variable1"
                },
                {
                    "id": "12345",
                    "name": "Thing of v1",
                    "slug": "variable1.something"
                },
            ],
            baseUrl: '', 
            searchAPIUrl: ''
        })

        // Here create new MentionTool with @ accessor key to use it as mention layout
        new MentionTool({
            holder: 'editorHolder', // This is the editor Holder ( see below )
            accessKey: "@", // Access key ( $ or @ )
            allUsers: [ // The array with the data you want to show when the users type @
                {
                    "id": "21029",
                    "name": "Kyle Ockford",
                    "avatar": "https://i.pravatar.cc/300",
                    "slug": "kyleockford"
                },
                {
                    "id": "21030",
                    "name": "Paige Cortez",
                    "avatar": "https://avatars.dicebear.com/api/croodles/your-custom-seed.svg",
                    "slug": "paigecortez"
                },
                {
                    "id": "21031",
                    "name": "Nyla Warren",
                    "slug": "nylawarren"
                },
                {
                    "id": "21032",
                    "name": "Hassan Lee",
                    "slug": "hassanlee"
                },
                {
                    "id": "21033",
                    "name": "Domas Rivas",
                    "avatar": "https://avatars.dicebear.com/api/pixel-art-neutral/kreudev.svg",
                    "slug": "domasrivas"
                },
                {
                    "id": "21034",
                    "name": "Arthur Hunt",
                    "slug": "arthurhunt"
                },
            ],
            baseUrl: '', 
            searchAPIUrl: ''
        })
    }, [])
    
    return (
        <ReactEditorJS onInitialize={handleInitialize} tools={EDITOR_JS_TOOLS} placeholder={`Write something here...`} holder="editorHolder"> 
            <div id="editorHolder" />
        </ReactEditorJS>
    )
}

 // Return the CustomEditor to use by other components.                    
                     
export default CustomEditor
```


## Screenshots

![App ddd](https://i.ibb.co/yhFCVH9/image.png)

