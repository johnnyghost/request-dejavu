/*jshint evil:true*/

/**
 * HTTPRequest.
 *
 * Licensed under the MIT license.
 * Copyright 2012 João Henriques joao@iknowaghost.com
 * https://github.com/iknowaghost
 */
define(['dejavu/Class'], function (Class) {

    'use strict';

    /**
     * XMLHTTPRequest Wrapper.
     *
     */
    var Request = Class.declare({

        $name      : 'Request',

        _url            : "",
        _type           : "",
        _method         : "GET",
        _headers        : {},
        _parameters     : {},
        _data           : {},
        _xhr            : null,
        _timeout        : 6000,
        _running        : false,
        _successCallback : null,
        _failureCallback: null,
        _jsonp          : 'callback',
        _jsonpCallback  : 'cb_',
        _jsonpData      : null,

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
            GET   : 'GET',
            POST  : 'POST',
            PUT   : 'PUT',
            DELETE: 'DELETE',
            HEAD  : 'HEAD'
        },

        /**
         * Constructor.
         *
         * @method
         *
         * @param {Object} object Contains the info that is necessary to build the request.
         */
        initialize: function (object) {

            if (!object.url) {
                throw "The request url could not be null.";
            }

            this._url           = object.url || this._url;
            this._method        = (object.method || this._method).toUpperCase();
            this._type          = object.type || this._type;
            this._parameters    = object.parameters || this._parameters;
            this._headers       = object.headers || this._headers;
            this._data          = object.data || this._data;
            this._jsonp         = object.jsonp || this._jsonp;
            this._jsonpCallback = object.jsonpCallback || this._jsonpCallback;
        },


        /**
         * Executes the request.
         *
         * @method
         */
        send: function () {

            this._buildRequest();
        },

        /**
         * Aborts the request.
         * The abort only occurs if the request is running.
         *
         * @method
         */
        abort: function () {

            if (this._running) {
                this._xhr.abort();
            }
        },

        /**
         * Checks if the request is running or not.
         *
         * @method
         *
         * @return {Boolean} The execution state of the request
         */
        isRunning: function () {

            return this._running;
        },

        /**
         * Method that is called when the request responds with a success.
         *
         * @method
         *
         * @param {Function} callback The callback function
         */
        success: function (callback) {

            if (this._running) {
                return;
            }

            this._successCallback = callback;

            if (this._xhr) {
                callback.call(null, (this._jsonpData || this._parseResponse(this._xhr)));
                this._xhr = null;
            }
        },

        /**
         * Method that is called when the request responds with a failure.
         *
         * @method
         *
         * @param {Function} callback The callback function
         */
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

        /**
         * Get the value of a parameter.
         *
         * @method
         *
         * @param   {String} parameter The key of the parameter
         *
         * @return  {String} The value of the parameter
         */
        getParameter: function (parameter) {

            return this._parameters[parameter];
        },

        /**
         * Set the value of a parameter
         *
         * @method
         *
         * @param   {String} parameter The key of the parameter
         * @param   {String} value     The value of the parameter
         */
        setParameter: function (parameter, value) {

            this._parameters[parameter] = value;

            return this;
        },

        /**
         * Check if exists the parameter on the parameters object.
         *
         * @method
         *
         * @param {String} parameter The parameter key
         *
         * @return {Boolean} The existence of the parameter
         */
        hasParameter: function (parameter) {

            return !!this._parameters[parameter];
        },

        /**
         * Remove a parameter.
         *
         * @method
         *
         * @param {String} parameter The parameter key
         */
        unsetParameter: function (parameter) {

            delete this._parameters[parameter];
        },

        /**
         * Get all the parameters.
         *
         * @method
         *
         * @return {Object} All the parameters
         */
        getParameters: function () {

            return this._parameters;
        },

        /**
         * Get the value of a body parameter.
         *
         * @method
         *
         * @param   {String} body_parameter The key of the body parameter
         *
         * @return  {String} The value of the body parameter
         */
        getBodyParameter: function (body_parameter) {

            return this._data[body_parameter];
        },

        /**
         * Set the value of a body parameter
         *
         * @method
         *
         * @param   {String} body_parameter The key of the a body parameter
         * @param   {String} value          The value of the parameter
         */
        setBodyParameter: function (body_parameter, value) {

            this._data[body_parameter] = value;

            return this;
        },

        /**
         * Check if exists the body parameter on the data object.
         *
         * @method
         *
         * @param {String} body_parameter The body parameter key
         *
         * @return {Boolean} The existence of the body parameter
         */
        hasBodyParameter: function (body_parameter) {

            return !!this._data[body_parameter];
        },

        /**
         * Remove a body parameter.
         *
         * @method
         *
         * @param {String} body_parameter The body parameter key
         */
        unsetBodyParameter: function (body_parameter) {

            delete this._data[body_parameter];
        },

        /**
         * Get all the body parameters.
         *
         * @method
         *
         * @return {Object} All the body parameters
         */
        getBodyParameters: function () {

            return this._data;
        },

        /**
         * Get the value of a header.
         *
         * @method
         *
         * @param   {String} header The key of the header
         *
         * @return  {String} The value of the header
         */
        getHeader: function (header) {

            return this._headers[header];
        },

        /**
         * Set the value of a header
         *
         * @method
         *
         * @param   {String} header The key of the a body parameter
         * @param   {String} value  The value of the parameter
         */
        setHeader: function (header, value) {

            this._headers[header] = value;

            return this;
        },

        /**
         * Check if exists the header on the headers object.
         *
         * @method
         *
         * @param {String} header The header  key
         *
         * @return {Boolean} The existence of the header
         */
        hasHeader: function (header) {

            return !!this._headers[header];
        },

        /**
         * Remove a header.
         *
         * @method
         *
         * @param {String} header The header key
         */
        unsetHeader: function (header) {

            delete this._headers[header];
        },

        /**
         * Get all the headers.
         *
         * @method
         *
         * @return {Object} All the headers
         */
        getHeaders: function () {

            return this._headers;
        },

        /**
         * Get the url.
         *
         * @method
         *
         * @return  {String} The url
         */
        getUrl: function () {

            return this._url;
        },

        /**
         * Set the url.
         *
         * @method
         *
         * @param {String} url The url string
         */
        setUrl: function (url) {

            this._url = url;

            return this;
        },

        /**
         * Get the type of the request.
         * If the type is not passed in the constructor, he will guess.
         *
         * @method
         *
         * @return  {String} The type of the request
         */
        getType: function () {

            return this._type || this.__guessType(this._url);
        },

        /**
         * Set the type of the request
         *
         * @method
         *
         * @param {String} type The type
         */
        setType: function (type) {

            this._type = type;

            return this;
        },

        /**
         * Get the timeout of the request
         *
         * @method
         *
         * @return  {Number} The timeout
         */
        getTimeout: function () {

            return this._timeout;
        },

        /**
         * Set the timeout of the request.
         *
         * @method
         *
         * @param {Number} timeout The timeout of the request
         */
        setTimeout: function (timeout) {

            this._timeout = timeout;

            return this;
        },


        /**
         * This method builds the request and executes it.
         * Here is were all the magic happens.
         *
         * @method
         * @protected
         */
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

                // Handlers
                this._xhr.onload = this._xhr.onreadystatechange = this.$bind(this._loadHandler);
                this._xhr.onprogress = this.$bind(this._progressHandler);
                this._xhr.onabort = this.$bind(this._abortHandler);
                this._xhr.ontimeout = this.$bind(this._timeoutHandler);

                this._running = true;

                // Executes the request
                this._xhr.send(this.__pararmeterStringify(this._data));
            }

        },

        /**
         * OnLoad handler.
         *
         * @method
         * @protected
         */
        _loadHandler: function () {

            this._running = false;

            if (this._xhr && this._xhr.readyState === 4) {
                if (this._xhr.status === 200) {
                    this.success(this.$bind(this._successCallback));
                } else {
                    this.failure(this.$bind(this._failureCallback));
                }
            }
        },

        /**
         * OnProgress handler.
         *
         * @method
         * @protected
         */
        _progressHandler: function () {

            this._running = true;
        },

        /**
         * OnAbort handler.
         *
         * @method
         * @protected
         */
        _abortHandler: function () {

            this._running = false;
        },

        /**
         * OnTimeout handler.
         *
         * @method
         * @protected
         */
        _timeoutHandler: function () {

            this.failure(this.$bind(this._failureCallback));
        },

        /**
         * Parse the response depending on the type.
         *
         * @method
         * @protected
         *
         * @param   {Object} request The xhr object
         *
         * @return  {Object} The parsed response
         */
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

        /**
         * Parse the headers.
         *
         * @method
         * @protected
         */
        _parseHeaders: function () {

            var header = null;

            this.setHeader("accept", this._headers.accept || this._defaultHeader.accept[this.getType()] || this._defaultHeader.accept['*']);

            // Set the Content-Type header when the method of the request is a POST and PUT
            if (this._method === this.$self.POST || this._method === this.$self.PUT) {
                this.setHeader("Content-Type", this._headers["Content-Type"] || this._defaultHeader["Content-Type"]);
            }

            for (header in this._headers) {
                if (this._headers.hasOwnProperty(header) && this._xhr) {
                    this._xhr.setRequestHeader(header, this._headers[header]);
                }
            }
        },

        /**
         * This method handles the request if is an jsonp.
         *
         * @method
         * @protected
         */
        _handleJsonp: function () {

            var date      = new Date(),
                uniqId    = date.getTime(),
                cbkey     = this._jsonp,
                cbval     = this._jsonpCallback === 'cb_' ? ('cb_' + uniqId) : this._jsonpCallback,
                script    = document.createElement('script'),
                head      = document.getElementsByTagName('head')[0],
                done      = false,
                parsedUrl;

            // Add the callback to the query parameter
            this.setParameter(cbkey, cbval);

            // Parse the url with the callback query parameter
            parsedUrl = this.__buildUrl(this._url, this._parameters);

            window[cbval] = this.$bind(this.__getJSONPResponse);

            script.type = 'text/javascript';
            script.src = parsedUrl;
            script.async = true;

            script.onload = script.onreadystatechange = function () {
                if (!done && (!this.readyState || this.readyState === "loaded" || this.readyState === "complete")) {
                    done = true;
                    script.onload = script.onreadystatechange = null;

                    if (script && script.parentNode) {
                        script.parentNode.removeChild(script);
                    }
                }
            };

            script.onerror = function (event, xhr) {
                console.log("erro", event, this._xhr);
            };

            head.appendChild(script);
        },

        /**
         * get the jsonp response.
         *
         * @method
         * @private
         *
         * @param   {Object} data The JSONP response
         */
        __getJSONPResponse: function (data) {

            this._jsonpData = data;
            this.success(this._successCallback);
        },

        /**
         * Concatenate url with the query parameters.
         *
         * @method
         * @private
         * @param   {String} url              The url string
         * @param   {Object} query_parameters The query parameters object
         *
         * @return  {String} The parsed url
         */
        __buildUrl: function (url, query_parameters) {

            var parsedUrl             = this.__extractParameters(url),
                parsedQueryParameters = this.__pararmeterStringify(query_parameters) ? "?" + this.__pararmeterStringify(query_parameters) : "";

            return parsedUrl + parsedQueryParameters;
        },

        /**
         * Convert the query parameters to a string.
         *
         * @method
         * @private
         *
         * @param   {Object} params The parameters of the request
         *
         * @return  {String} An string of patameters
         */
        __pararmeterStringify: function (params) {

            var parameters = [],
                parameter  = "";

            for (parameter in params) {
                if (params.hasOwnProperty(parameter)) {
                    parameters.push(encodeURIComponent(parameter) + "=" + encodeURIComponent(params[parameter]));
                }
            }

            parameters = parameters.length > 0 ? parameters.join("&") : "";

            return parameters;
        },

        /**
         * Extract from the url and replace by the respective parameter
         *
         * @method
         * @private
         *
         * @param   {String} url The url
         *
         * @return  {String} The parsed url
         */
        __extractParameters: function (url) {

            var regex = /\{(\w+)\}/g,

            replacer = function (parameters) {

                // Clone the object
                var requirementParameters = this.__cloneParameters(parameters);

                return function (placeholder, identifier) {

                    this.unsetParameter(identifier);

                    return requirementParameters[identifier];
                }.$bind(this);

            }.$bind(this);

            return url.replace(regex, replacer(this._parameters));
        },

        /**
         * Guesses the type of the request
         *
         * @method
         * @provate
         *
         * @param   {String} url The url
         *
         * @return  {String} The type of the request
         */
        __guessType: function (url) {

            var type = url.match(/\.(json|jsonp|html|xml)(\?|$)/);

            return type ? type[1] : 'js';
        },

        /**
         * Clone an parameters object.
         *
         * @method
         * @private
         *
         * @param {Object} params The parameters object
         *
         * @return {Object} Cloned parameters
         */
        __cloneParameters: function (params) {

            var clone = {},
                parameter;

            for (parameter in params) {
                if (params.hasOwnProperty(parameter)) {
                    clone[parameter] = params[parameter];
                }
            }

            return clone;

        },

        /**
         * Gets the xhr object depending on the browser that you are using
         *
         * @method
         * @private
         *
         * @return  {Object} An xhr instance
         */
        __getXhr: function () {

            var xhr = null;

            if (window.XMLHttpRequest) {
                // If the W3C-supported request object is avaiable, use that
                xhr = new window.XMLHttpRequest();
            } else if (window.ActiveXObject) {
                // Otherwise, if the IE-propriatry object is avaiable, use this
                xhr = new window.ActiveXObject("Msxml2.XMLHTTP");
            }

            return xhr;
        }
    });

    return Request;
});