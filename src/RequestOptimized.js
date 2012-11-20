define(['dejavu/Class'], function (Class) {
    'use strict';
    var Request = Class.declare(function ($self) {
            return {
                _url: '',
                _type: '',
                _method: 'GET',
                _headers: {},
                _parameters: {},
                _data: {},
                _xhr: null,
                _timeout: 6000,
                _running: false,
                _sucessCallback: null,
                _failureCallback: null,
                _jsonp: 'callback',
                _jsonpCallback: 'cb_',
                _jsonpData: null,
                _defaultHeader: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'accept': {
                        '*': 'text/javascript, text/html, application/xml, text/xml, */*',
                        'xml': 'application/xml, text/xml',
                        'html': 'text/html',
                        'text': 'text/plain',
                        'json': 'application/json, text/javascript',
                        'js': 'application/javascript, text/javascript'
                    }
                },
                $constants: {
                    GET: 'GET',
                    POST: 'POST',
                    PUT: 'PUT',
                    DELETE: 'DELETE',
                    HEAD: 'HEAD'
                },
                initialize: function (object) {
                    if (!object.url) {
                        throw 'The request url could not be null.';
                    }
                    this._url = object.url || this._url;
                    this._method = (object.method || this._method).toUpperCase();
                    this._type = object.type || this._type;
                    this._parameters = object.parameters || this._parameters;
                    this._headers = object.headers || this._headers;
                    this._data = object.data || this._data;
                    this._jsonp = object.jsonp || this._jsonp;
                    this._jsonpCallback = object.jsonpCallback || this._jsonpCallback;
                },
                send: function () {
                    this._buildRequest();
                },
                abort: function () {
                    if (this._running) {
                        this._xhr.abort();
                    }
                },
                isRunning: function () {
                    return this._running;
                },
                success: function (callback) {
                    if (this._running) {
                        return;
                    }
                    this._sucessCallback = callback;
                    if (this._xhr) {
                        callback.call(null, this._jsonpData || this._parseResponse(this._xhr));
                        this._xhr = null;
                    }
                },
                failure: function (callback) {
                    if (this._running) {
                        return;
                    }
                    this._failureCallback = callback;
                    if (this._xhr) {
                        callback.call(null, this._xhr);
                        this._xhr = null;
                    }
                },
                getParameter: function (parameter) {
                    return this._parameters[parameter];
                },
                setParameter: function (parameter, value) {
                    this._parameters[parameter] = value;
                    return this;
                },
                hasParameter: function (parameter) {
                    return !!this._parameters[parameter];
                },
                unsetParameter: function (parameter) {
                    delete this._parameters[parameter];
                },
                getParameters: function () {
                    return this._parameters;
                },
                getBodyParameter: function (body_parameter) {
                    return this._data[body_parameter];
                },
                setBodyParameter: function (body_parameter, value) {
                    this._data[body_parameter] = value;
                    return this;
                },
                hasBodyParameter: function (body_parameter) {
                    return !!this._data[body_parameter];
                },
                unsetBodyParameter: function (body_parameter) {
                    delete this._data[body_parameter];
                },
                getBodyParameters: function () {
                    return this._data;
                },
                getHeader: function (header) {
                    return this._headers[header];
                },
                setHeader: function (header, value) {
                    this._headers[header] = value;
                    return this;
                },
                hasHeader: function (header) {
                    return !!this._headers[header];
                },
                unsetHeader: function (header) {
                    delete this._headers[header];
                },
                getHeaders: function () {
                    return this._headers;
                },
                getUrl: function () {
                    return this._url;
                },
                setUrl: function (url) {
                    this._url = url;
                    return this;
                },
                getType: function () {
                    return this._type || this.__guessType(this._url);
                },
                setType: function (type) {
                    this._type = type;
                    return this;
                },
                getTimeout: function () {
                    return this._timeout;
                },
                setTimeout: function (timeout) {
                    this._timeout = timeout;
                    return this;
                },
                _buildRequest: function () {
                    this._xhr = this.__getXhr();
                    if (this._type === 'jsonp') {
                        return this._handleJsonp(this._url);
                    }
                    if (this._xhr) {
                        var parsedUrl = this.__buildUrl(this._url, this._parameters);
                        this._xhr.open(this._method, parsedUrl, true);
                        this._parseHeaders(this._headers);
                        this._xhr.timeout = this.getTimeout();
                        this._xhr.onload = this._xhr.onreadystatechange = this.bind(this._loadHandler);
                        this._xhr.onprogress = this.bind(this._progressHandler);
                        this._xhr.onabort = this.bind(this._abortHandler);
                        this._xhr.ontimeout = this.bind(this._timeoutHandler);
                        this._running = true;
                        this._xhr.send(this.__pararmeterStringify(this._data));
                    }
                },
                _loadHandler: function () {
                    this._running = false;
                    if (this._xhr && this._xhr.readyState === 4) {
                        if (this._xhr.status === 200) {
                            this.success(this.bind(this._sucessCallback));
                        } else {
                            this.failure(this.bind(this._failureCallback));
                        }
                    }
                },
                _progressHandler: function () {
                    this._running = true;
                },
                _abortHandler: function () {
                    this._running = false;
                },
                _timeoutHandler: function () {
                    this.failure(this.bind(this._failureCallback));
                },
                _parseResponse: function (request) {
                    var response = request.responseText;
                    if (response) {
                        switch (this.getType()) {
                        case 'json':
                            response = JSON.parse(response);
                            break;
                        case 'xml':
                            response = request.responseXML;
                            break;
                        case 'html':
                            response = response;
                            break;
                        case 'js':
                            response = eval(response);
                            break;
                        }
                    }
                    return response;
                },
                _parseHeaders: function () {
                    var header = null;
                    this.setHeader('accept', this._headers.accept || this._defaultHeader.accept[this.getType()] || this._defaultHeader.accept['*']);
                    if (this._method === $self.POST || this._method === $self.PUT) {
                        this.setHeader('Content-Type', this._headers['Content-Type'] || this._defaultHeader['Content-Type']);
                    }
                    for (header in this._headers) {
                        if (this._headers.hasOwnProperty(header) && this._xhr) {
                            this._xhr.setRequestHeader(header, this._headers[header]);
                        }
                    }
                },
                _handleJsonp: function () {
                    var date = new Date(), uniqId = date.getTime(), cbkey = this._jsonp, cbval = this._jsonpCallback === 'cb_' ? 'cb_' + uniqId : this._jsonpCallback, script = document.createElement('script'), head = document.getElementsByTagName('head')[0], done = false, parsedUrl;
                    this.setParameter(cbkey, cbval);
                    parsedUrl = this.__buildUrl(this._url, this._parameters);
                    window[cbval] = this.bind(this.__getJSONPResponse);
                    script.type = 'text/javascript';
                    script.src = parsedUrl;
                    script.async = true;
                    script.onload = script.onreadystatechange = function () {
                        if (!done && (!this.readyState || this.readyState === 'loaded' || this.readyState === 'complete')) {
                            done = true;
                            script.onload = script.onreadystatechange = null;
                            if (script && script.parentNode) {
                                script.parentNode.removeChild(script);
                            }
                        }
                    };
                    script.onerror = function (event, xhr) {
                        console.log('erro', event, this._xhr);
                    };
                    head.appendChild(script);
                },
                __getJSONPResponse: function (data) {
                    this._jsonpData = data;
                    this.success(this._sucessCallback);
                },
                __buildUrl: function (url, query_parameters) {
                    var parsedUrl = this.__extractParameters(url), parsedQueryParameters = this.__pararmeterStringify(query_parameters) ? '?' + this.__pararmeterStringify(query_parameters) : '';
                    return parsedUrl + parsedQueryParameters;
                },
                __pararmeterStringify: function (params) {
                    var parameters = [], parameter = '';
                    for (parameter in params) {
                        if (params.hasOwnProperty(parameter)) {
                            parameters.push(encodeURIComponent(parameter) + '=' + encodeURIComponent(params[parameter]));
                        }
                    }
                    parameters = parameters.length > 0 ? parameters.join('&') : '';
                    return parameters;
                },
                __extractParameters: function (url) {
                    var regex = /\{(\w+)\}/g, replacer = function (parameters) {
                            var requirementParameters = this.__cloneParameters(parameters);
                            return function (placeholder, identifier) {
                                this.unsetParameter(identifier);
                                return requirementParameters[identifier];
                            }.bind(this);
                        }.bind(this);
                    return url.replace(regex, replacer(this._parameters));
                },
                __guessType: function (url) {
                    var type = url.match(/\.(json|jsonp|html|xml)(\?|$)/);
                    return type ? type[1] : 'js';
                },
                __cloneParameters: function (params) {
                    var clone = {}, parameter;
                    for (parameter in params) {
                        if (params.hasOwnProperty(parameter)) {
                            clone[parameter] = params[parameter];
                        }
                    }
                    return clone;
                },
                __getXhr: function () {
                    var xhr = null;
                    if (window.XMLHttpRequest) {
                        xhr = new window.XMLHttpRequest();
                    } else if (window.ActiveXObject) {
                        xhr = new window.ActiveXObject('Msxml2.XMLHTTP');
                    }
                    return xhr;
                }
            };
        });
    return Request;
});