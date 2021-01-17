'use strict'

var numberOfTestedLinks = 0
var numberOfBrokenLinks = 0
var links = document.querySelectorAll('a')
var linksBackup = links

/**
 * The following function call listens for a message from start_trek.js
 */
browser.runtime.onMessage.addListener(request => {
  console.log('Message from extension popup.')
  if (request.command === 'getLinks') {
    return Promise.resolve({ linkCount: getURLS() })
  }
  if (request.command === 'cancelGetLinks') {
    console.log('Received cancel command.')
    cancelLinkModification()
    return Promise.resolve({
      linkCount: links.length,
      testedLinkCount: numberOfTestedLinks,
      brokenLinkCount: numberOfBrokenLinks
    })
  }
  if (request.command === 'resetGlobals') {
    console.log('Received command to reset global variables.')
    resetCurrentGlobals()
  }
  if (request.command === 'resetPage') {
    console.log('Received reset command.')
    resetPage()
    // resetCurrentGlobals()
    return Promise.resolve({ message: 'Reset for page complete.' })
  }
})

/**
 * 'link' is an anchor tag in the collection.
 * The function is asynchronous to allow multiple links to be updated parallely.
 */
async function askHeaders (link) {
  let oReq = new XMLHttpRequest()
  oReq.open('HEAD', link.href)
  oReq.send()
  /**
   * In case headers were received, highlight links.
   */
  oReq.onload = () => {
    if (oReq.readyState == 4) {
      console.log(oReq.status + '/' + link.href)
      switch (oReq.status) {
        case 200: //OK
        case 201: //Request fulfilled, new resource created.
        case 202: //Request accepted, processing request.
        case 203: //Server is a transforming proxy
        case 204: //Request accepted, but no content to send.
        case 205: //Server not returning content, asking requester to reset view.
        case 206: //Delivering partial content.
        case 207: //Multi-Status XML
        case 226: //Instance manipulation used in response.
        case 401: //Unauthorized.
        case 403: //Forbidden.
        case 408: //Request timeout.
        case 423: //Request is locked.
        case 511: //Network authentication required.
          /**
           * Setting a custom attribute. Refer HTML5 custom attributes.
           */
          link['data-status'] = 'alive'
          highlightLink(link)
          break
        case 400: //Bad request.
        // case 402: //Reserved for future use. Currently used for various things.
        case 404: //Not found.
        // case 405: //Method not allowed.
        case 406: //Not acceptable.
        // case 407: //Proxy required.
        // case 409: //Edit conflict.
        case 410: //Resource is permanently gone.
        // case 411: //Length required in request.
        // case 412: //Precondition failed. Request missing something.
        // case 413: //Payload too large.
        // case 414: //URI too long.
        // case 415: //Unsupported media type.
        // case 416: //Server cannot supply portion of a file.
        // case 417: //Server cannot satisfy request's Expect field.
        // case 421: //Misdirected request.
        // case 422: //Semantic errors in request.
        // case 424: //Request depended on a failed request.
        // case 425: //Server received a replayed request.
        case 426: //Upgraded TLS version required.
        // case 428: //Precondition required.
        // case 429: //Too may requests.
        // case 451: //Unavailable for legal reasons.
        case 500: //Internal server error.
        case 501: //Not implemented the request method.
        case 502: //Bad gateway.
        case 503: //Server overloaded.
        case 504: //Gateway timeout. Did not receive response from upstream.
        case 505: //HTTP version not supported.
        // case 510: //Server requires more extensions to the request.
          /**
           * Setting a custom attribute. Refer HTML5 custom attributes.
           */
          link['data-status'] = 'dead'
          highlightLink(link)
          numberOfBrokenLinks++
          break
        default:
          link['data-status'] = 'unknown'
          highlightLink(link)
      }
      numberOfTestedLinks++
      browser.runtime.sendMessage({
        testedLinkCount: numberOfTestedLinks,
        brokenLinkCount: numberOfBrokenLinks
      })
    }
  }

  /**
   * In case of any error, highlight the link anyway.
   */
  oReq.onerror = () => {
    console.log('onERROR: ' + oReq.status + link.href)
    link['data-status'] = 'unknown'
    highlightLink(link)
    numberOfTestedLinks++
  }
}

/**
 * This function highlights the link according to its "data-status" attribute.
 */
function highlightLink (link) {
  //Background colours.
  let aliveLinkBackground = '#BCED4C'
  let deadLinkBackground = '#ED8C7B'
  let anyOtherLinkBackground = '#808080'

  //Foreground colours.
  let aliveLinkForeground = '#000000'
  let deadLinkForeground = '#ffffff'
  let anyOtherLinkForeground = '#ffff00'

  /**
   * Only highlight links if data-cancel-request is false.
   * 'false' implies that no cancel request has been given.
   */
  if (link['data-cancel-request'] === false) {
    if (link['data-status'] === 'alive') {
      link.style.backgroundColor = aliveLinkBackground
      link.style.color = aliveLinkForeground
    } else if (link['data-status'] === 'dead') {
      link.style.backgroundColor = deadLinkBackground
      link.style.color = deadLinkForeground
    } else {
      link.style.backgroundColor = anyOtherLinkBackground
      link.style.color = anyOtherLinkForeground
    }
  }
}

/**
 * This function extracts anchor tags from the web page, asking for
 * each one's headers in the process.
 */
function getURLS () {
  for (let i = 0; i < links.length; i++) {
    links[i]['data-cancel-request'] = false
    askHeaders(links[i])
  }
  return links.length
}

/**
 * This function resets the page by restoring the state of each
 * link to its original state.
 */
function resetPage () {
  // resetCurrentGlobals()
  for (let i = 0; i < links.length; i++) {
    links[i].style = linksBackup[i].style
  }
  // browser.runtime.sendMessage({command: 'resetGlobals'})
}

/**
 * This function resets the global variables in this
 * script.
 */
function resetCurrentGlobals () {
  numberOfTestedLinks = 0
  numberOfBrokenLinks = 0
  links = document.querySelector('a')
  linksBackup = links
}

/**
 * This asynchronous function cancels highlighting.
 * However, doesn't stop XHRs from being sent.
 */
async function cancelLinkModification () {
  for (let i = 0; i < links.length; i++) {
    links[i]['data-cancel-request'] = true
  }
}