// call issue_badge
/* eslint-disable no-unused-vars */
/* eslint-env jquery */
// Modified by Corporate Finance Institute on 2026-08-28:
// support the Redmine 7 top-menu DOM while retaining responsive placement.
const badgeTemplate = `
<div id="issue_badge">
  <li class="starting_point">
    <a style="cursor: pointer" onclick="displayBadgeContents();" id="link_issue_badge" data-content_path="">
      <span id="issue_badge_number" class="badge red"></span>
    </a>
  </li>
</div>
`

const changeBadgeLocation = () => {
  const issueBadgeElement = document.getElementById('issue_badge')
  if (!issueBadgeElement) return false

  if (window.matchMedia('(max-width: 899px)').matches) {
    const quickSearch = document.getElementById('quick-search')
    if (!quickSearch) return false

    quickSearch.insertBefore(issueBadgeElement, quickSearch.firstChild)
    return true
  }

  const loggedas = document.getElementById('loggedas')
  if (loggedas) {
    loggedas.insertAdjacentElement('afterend', issueBadgeElement)
    return true
  }

  // Redmine 7 removed #loggedas and renders the avatar account dropdown in
  // #top-menu .profile-menu. Keep the badge visible immediately beside it.
  const profileMenu = document.querySelector('#top-menu .profile-menu')
  if (!profileMenu) return false

  const account = profileMenu.querySelector('#account')
  profileMenu.insertBefore(issueBadgeElement, account)
  return true
}

const mountBadge = () => {
  let issueBadgeElement = document.getElementById('issue_badge')
  if (!issueBadgeElement) {
    if (!document.body) return false

    document.body.insertAdjacentHTML('beforeend', badgeTemplate)
    issueBadgeElement = document.getElementById('issue_badge')
  }

  return changeBadgeLocation()
}

const loadBadge = (url, optionPollUrl) => {
  baseRequest(url, 'json').then((data) => {
    if (!mountBadge()) return

    let status = document.getElementById('issue_badge_number')
    let badgeLink = document.getElementById('link_issue_badge')
    document.getElementById('issue_badge').style.display = 'block'
    if (typeof data.all_issues_count !== 'undefined' && data.status === true) {
      status.textContent = data.all_issues_count
      status.className = 'badge ' + data.badge_color
      badgeLink.dataset.content_path = data.content_path
    } else {
      status.textContent = '?'
    }
    if (optionPollUrl) {
      pollBadgeCount(optionPollUrl)
    }
  }).catch(() => { /* do nothing */ })
}

// Load and popup BadgeContents
const displayBadgeContents = () => {
  let url = document.getElementById('link_issue_badge').dataset.content_path
  baseRequest(url).then((html) => {
    if (html.length > 0) {
      document.getElementById('link_issue_badge').insertAdjacentHTML('afterend', html)
    }
  }).catch(() => { /* do nothing */ })
}

// Hide BadgeContents
document.addEventListener('click', (event) => {
  const badgeContents = document.getElementById('issue_badge_contents')

  if (badgeContents && !badgeContents.contains(event.target)) {
    badgeContents.remove()
  }
})

// Polling setting
const pollBadgeCount = (pollingUrl) => {
  const poll = (pollingUrl) => {
    let status = document.getElementById('issue_badge_number')
    baseRequest(pollingUrl, 'json')
      .then((data) => {
        document.getElementById('issue_badge').style.display = 'block'
        let badgeLink = document.getElementById('link_issue_badge')
        if (typeof data.all_issues_count !== 'undefined' && data.status === true) {
          status.textContent = data.all_issues_count
          status.className = 'badge ' + data.badge_color
          badgeLink.dataset.content_path = data.content_path
        } else {
          status.textContent = '?'
          clearInterval(pollInterval)
        }
      })
      .catch(() => {
        // Stop polling and resolve
        clearInterval(pollInterval)
      })
  }
  const pollInterval = setInterval(poll, 60000, pollingUrl)
}

window.addEventListener('resize', changeBadgeLocation)

// Common method to send request and return response text
const baseRequest = (url, type) => {
  return new Promise((resolve, reject) => {
    let request = new window.XMLHttpRequest()
    request.open('GET', url, true)

    if (type) {
      request.responseType = type
    }

    request.onload = () => {
      // Only update nadge when success. Do nothing when status is error.
      if (request.status >= 200 && request.status < 400) {
        resolve(request.response)
      } else {
        reject(new Error(request.statusText))
      }
    }

    request.onerror = () => {
      reject(new Error(request.statusText))
    }
    request.send()
  })
}

/* eslint-enable no-unused-vars */
