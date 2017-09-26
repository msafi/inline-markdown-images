'use babel'

import path from 'path'

const imageStyle = `max-width: 100%;`
const imageContainerStyle = `text-align: center; padding: 5px; display: none;`
const allMarkdownImagesRegExp = /^!\[[^\]\n]*\]\([^)\n]+\)$/g
const markdownImageLinkCaptureGroupRegExp = /^!\[[^\]\n]*\]\(([^)\n]+)\)$/
const networkPathRegExp = /^(?:[a-z]+:)?\/\//i
const strInside = 'inside'
const strBefore = 'before'
const strBlock = 'block'
const strDiv = 'div'
const strImg = 'img'
const arrGithubMarkdown = ['GitHub Markdown','Markdown']
const objIsImiMarker = {isImiMarker: true}
const objInvalidate = {invalidate: strInside}

export default {
  processTextBuffer(editor) {
    const currentMarkers = editor.getMarkers()
    const currentValidMarkers = []

    currentMarkers.forEach((marker) => {
      if (isImiMarker(marker)) {
        if (!marker.isValid()) {
          marker.destroy()
        } else {
          currentValidMarkers.push(marker)
        }
      }
    })

    return editor.scan(allMarkdownImagesRegExp, (hit) => {
      const hitIsMarked = !!currentValidMarkers.find((marker) => {
        return hit.computedRange.start.row == marker.getBufferRange().start.row
      })

      if (!hitIsMarked) {
        const link = hit.matchText.match(markdownImageLinkCaptureGroupRegExp)[1]
        const finalLink = (isNetworkPath(link) || path.isAbsolute(link)) ?
          link :
          path.join(path.dirname(editor.buffer.file.path), link)
        const imageContainer = document.createElement(strDiv)
        const image = document.createElement(strImg)
        const marker = editor.markBufferRange(hit.computedRange, objInvalidate)

        imageContainer.appendChild(image)
        imageContainer.style = imageContainerStyle

        image.style = imageStyle
        image.src = finalLink
        image.onload = () => imageContainer.style.display = strBlock

        marker.bufferMarker.setProperties(objIsImiMarker)

        return editor.decorateMarker(marker, {type: strBlock, item: imageContainer, position: strBefore})
      }
    })
  },

  activate() {
    atom.workspace.observeTextEditors((editor) => {
      // if (editor.getGrammar().name === arrGithubMarkdown) {
      if (arrGithubMarkdown.includes(editor.getGrammar().name)) {
        this.processTextBuffer(editor)

        editor.onDidStopChanging(this.processTextBuffer.bind(null, editor))
      }
    })
  }
}

function isImiMarker(marker) {
  return marker.bufferMarker && marker.bufferMarker.properties.isImiMarker
}

function isNetworkPath(path) {
  return networkPathRegExp.test(path)
}
