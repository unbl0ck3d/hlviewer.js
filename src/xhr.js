export default function xhr(url, {method, isBinary, progressCallback} = {}) {
    method = method || 'GET'
    isBinary = isBinary || false
    progressCallback = progressCallback || null

    if (!url) {
        throw new Error('Url parameter missing')
    }
    
    return new Promise((resolve, reject) => {
        let request = new XMLHttpRequest()

        if (isBinary) {
            request.responseType = 'arraybuffer'
        }

        if (isBinary && progressCallback) {
            request.addEventListener('progress', (event) => {
                if (event.lengthComputable) {
                    progressCallback(request, event.loaded / event.total)
                } else {
                    // HACK!
                    let total = request.getResponseHeader('content-length')
                    let encoding = request.getResponseHeader('content-encoding')
                    if (total && encoding && (encoding.indexOf('gzip') > -1)) {
                        // assuming average gzip compression ratio to be 25%
                        total *= 4
                        let loadedPercent = Math.min(0.99, event.loaded / total)
                        progressCallback(request, loadedPercent)
                    // END OF HACK
                    } else {
                        progressCallback(request, 0)
                    }
                }
            })
        }

        request.addEventListener('readystatechange', (event) => {
            if (event.target.readyState !== 4) {
                return
            }

            if (event.target.status === 200) {
                if (progressCallback) {
                    progressCallback(request, 1)
                }

                resolve(event.target.response)
            } else {
                reject({
                    status: event.target.status
                })
            }
        })

        request.open(method, url, true)
        request.send()
    })
}