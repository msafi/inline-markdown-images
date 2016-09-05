'use babel'

const imageStyle = `max-width: 100%;`
const imageContainerStyle = `text-align: center; padding: 5px; display: none;`
const allMarkdownImagesRegExp = /^!\[[^\]]+\]\([^)]+\)$/g
const markdownImageLinkCaptureGroupRegExp = /!\[[^\]]+\]\(([^)]+)\)/
const strInside = 'inside'
const strBefore = 'before'
const strBlock = 'block'
const strDiv = 'div'
const strImg = 'img'
const strGithubMarkdown = 'GitHub Markdown'
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
        const imageContainer = document.createElement(strDiv)
        const image = document.createElement(strImg)
        const marker = editor.markBufferRange(hit.computedRange, objInvalidate)

        imageContainer.appendChild(image)
        imageContainer.style = imageContainerStyle

        image.style = imageStyle
        image.src = link
        image.onload = () => imageContainer.style.display = strBlock

        marker.bufferMarker.setProperties(objIsImiMarker)

        return editor.decorateMarker(marker, {type: strBlock, item: imageContainer, position: strBefore})
      }
    })
  },

  activate() {
    atom.workspace.observeTextEditors((editor) => {
      if (editor.getGrammar().name === strGithubMarkdown) {
        this.processTextBuffer(editor)

        editor.onDidStopChanging(this.processTextBuffer.bind(null, editor))
      }
    })
  }
}

function isImiMarker(marker) {
  return marker.bufferMarker && marker.bufferMarker.properties.isImiMarker
}
