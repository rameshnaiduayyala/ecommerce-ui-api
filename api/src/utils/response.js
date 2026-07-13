/**
 * Formats a standardized JSON API response.
 *
 * @param {boolean} success - Operation success flag.
 * @param {string} message - Response message.
 * @param {any} [data=null] - Payload returned from the controller/service.
 * @param {any} [meta=null] - Pagination and meta information.
 * @param {any} [errors=null] - Error diagnostics if operation failed.
 * @returns {object} Standardized response object.
 */
export function formatResponse(success, message, data = null, meta = null, errors = null) {
  return {
    success,
    message,
    data,
    meta,
    errors
  };
}
