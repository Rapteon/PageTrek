'use strict'

//Objects representing the elements present in the popup.
let startButton
let cancelButton
let resetButton
let statusLine
let brokenStatusLine

let testedLinks = 0,
  brokenLinks = 0,
  maxLinks = 0
let cancelStatus = false

//The following line is executed once for each page loaded.
browser.tabs
  .executeScript({ file: '/content_scripts/extraction.js' })
  .then(listenForClicks)
  .catch(errorHappens)

//Message listener to listen during testing of links.
browser.runtime.onMessage.addListener(linkTestUpdate => {
  console.log('Message from extractions.js')
  statusLine = document.getElementById('status-line')
  brokenStatusLine = document.getElementById('broken-status-line')

  testedLinks = linkTestUpdate.testedLinkCount
  brokenLinks = linkTestUpdate.brokenLinkCount

  statusLine.textContent = 'Tested: ' + testedLinks + ' / ' + maxLinks
  brokenStatusLine.textContent = 'Broken: ' + brokenLinks + ' / ' + maxLinks

  if (testedLinks === maxLinks && cancelStatus === false) {
    cancelButton = document.getElementById('cancel-trek')

    askRetry()

    hideElement(cancelButton)
    hideElement(statusLine)
  }
})

function listenForClicks () {
  console.log('Listening...')
  startButton = document.getElementById('start-trek')
  resetButton = document.getElementById('reset-trek')
  cancelButton = document.getElementById('cancel-trek')
  startButton.addEventListener('click', startTrek)
  resetButton.addEventListener('click', resetTrek)
  cancelButton.addEventListener('click', cancelTrek)
}

function errorHappens (message) {
  console.log('Error occurred: ' + message)
}

/**
 * Disables the start button and asks to re-open the extension popup.
 */
function askRetry () {
  startButton = document.getElementById('start-trek')
  disableButton(startButton)
  startButton.innerText = 'Start the Popup Again'
}

//Asks 'extraction.js' to obtain links from the web-page and highlight links.
function startTrek () {
  /**
   * Checking if the tab is active and is the currentWindow.
   * If yes, then the response from the sendMessage() function is stored in 'response', which uses
   * an arrow function. The 'cancel' button becomes visible.
   * If no, then the error is caught and printed to the console.
   */
  // resetGlobalsRequest()
  // resetCurrentGlobals()
  browser.tabs
    .query({ active: true, currentWindow: true })
    .then(tabs => {
      browser.tabs
        .sendMessage(tabs[0].id, { command: 'getLinks' })
        .then(response => {
          statusLine = document.getElementById('status-line')
          brokenStatusLine = document.getElementById('broken-status-line')
          cancelButton = document.getElementById('cancel-trek')
          resetButton = document.getElementById('reset-trek')

          maxLinks = response.linkCount

          statusLine.textContent = 'Tested: ' + testedLinks + ' / ' + maxLinks
          brokenStatusLine.textContent =
            'Broken: ' + brokenLinks + ' / ' + maxLinks

          unhideElement(cancelButton)
          unhideElement(statusLine)
          unhideElement(brokenStatusLine)

          disableButton(startButton)
        })
        .catch(errorHappens)
    })
    .catch(errorHappens)
}

function cancelTrek () {
  console.log('Cancel request provided.')
  browser.tabs
    .query({ active: true, currentWindow: true })
    .then(tabs => {
      browser.tabs
        .sendMessage(tabs[0].id, { command: 'cancelGetLinks' })
        .then(response => {
          maxLinks = response.linkCount
          cancelStatus = true

          cancelButton = document.getElementById('cancel-trek')
          statusLine = document.getElementById('status-line')
          brokenStatusLine = document.getElementById('broken-status-line')

          hideElement(cancelButton)
          hideElement(statusLine)
          hideElement(brokenStatusLine)

          askRetry()
        })
        .catch(errorHappens)
    })
    .catch(errorHappens)
}

//Resets the current page when reset button is clicked.
function resetTrek () {
  resetPageRequest()
  /**
   * These statements are required since reset may be pressed while the 'cancel' button
   * is pressed before checking the links.
   */
  cancelButton = document.getElementById('cancel-trek')
  resetButton = document.getElementById('reset-trek')
  cancelButton = document.getElementById('cancel-trek')
  statusLine = document.getElementById('status-line')
  brokenStatusLine = document.getElementById('broken-status-line')

  if (cancelButton !== null) hideElement(cancelButton)
  if (statusLine !== null) hideElement(statusLine)
  if (brokenStatusLine !== null) hideElement(brokenStatusLine)
  if (resetButton !== null) hideElement(resetButton)

  askRetry()
}

/**
 * The following function sends a message to the content
 * script to reset its global variables. This needs more work,
 * since global variables are not being reset presently.
 */
function resetGlobalsRequest () {
  browser.tabs.query({ active: true, currentWindow: true }).then(tabs => {
    browser.tabs
      .sendMessage(tabs[0].id, { command: 'resetGlobals' })
      .then(resetResponse => {
        console.log('Message from extraction.js')
        // console.log(resetResponse.message)
      })
      .catch(errorHappens)
  })
}

// function resetCurrentGlobals(){
//   testedLinks = 0
//   brokenLinks = 0
//   maxLinks = 0
// }

/**
 * The following function sends a request to reset the page. This message will make
 * the content script remove highlights applied to the page.
 */
function resetPageRequest () {
  browser.tabs
    .query({ active: true, currentWindow: true })
    .then(tabs => {
      browser.tabs
        .sendMessage(tabs[0].id, { command: 'resetPage' })
        .then(response => {
          console.log(response.message)
        })
        .catch(errorHappens)
    })
    .catch(errorHappens)
}

function disableButton (button) {
  button.disabled = 'true'
  button.style.opacity = '40%'
  button.style.cursor = 'not-allowed'
}

function enableButton (button) {
  button.disabled = 'false'
  button.style.opacity = '100%'
  button.style.cursor = 'pointer'
}
function isEnabled (button) {
  if (button.disabled === 'true') return true
  else return false
}
function hideElement (element) {
  element.classList.add('hidden')
}
function unhideElement (element) {
  element.classList.remove('hidden')
}