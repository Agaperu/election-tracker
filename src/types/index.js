// Type definitions converted to JSDoc comments for better IDE support

/**
 * @typedef {Object} Candidate
 * @property {string} id
 * @property {string} name
 * @property {'democrat' | 'republican' | 'other'} party
 * @property {number} votes
 * @property {number} percentage
 * @property {boolean} incumbent
 */

/**
 * @typedef {Object} Race
 * @property {string} id
 * @property {string} title
 * @property {string} state
 * @property {'presidential' | 'senate' | 'house' | 'governor' | 'other'} type
 * @property {Candidate[]} candidates
 * @property {Object} precincts
 * @property {number} precincts.total
 * @property {number} precincts.reporting
 * @property {number} precincts.percentage
 * @property {string} lastUpdated
 * @property {boolean} called
 * @property {string} [winner]
 * @property {boolean} isLive
 */

/**
 * @typedef {Object} ElectionSource
 * @property {string} id
 * @property {string} name
 * @property {string} url
 * @property {string} [logo]
 * @property {boolean} enabled
 * @property {string} [lastScrape]
 * @property {number} scrapingInterval
 */

/**
 * @typedef {Object} ScrapeConfig
 * @property {ElectionSource[]} sources
 * @property {number} refreshInterval
 * @property {boolean} isRunning
 * @property {string} [lastScrapeTime]
 */

/**
 * @typedef {Object} ElectionData
 * @property {Race[]} races
 * @property {string} lastUpdated
 */

/**
 * @typedef {Object} SettingsState
 * @property {boolean} darkMode
 * @property {boolean} autoRefresh
 * @property {number} refreshInterval
 * @property {boolean} notifications
 * @property {string[]} focusedStates
 * @property {string[]} focusedRaces
 */

// Export empty object to make this a module
export {};