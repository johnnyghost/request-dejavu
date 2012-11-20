require.config({

    paths: {
        'amd-utils': '../lib/amd-utils/src'
    },

    packages: [{
            name: 'dejavu',
            location: '../lib/dejavu/dist/amd/strict'
        }
    ]
});

// Start the main app logic.
require(['../src/Request'], function (Request) {

    'use strict';

    var request = new Request({
        url: "http://vimeo.com/api/v2/{user}/videos.json",
        method: "GET",
        type: "jsonp",
        parameters: {
            "user": "davidmarques",
            "q": "ted",
            "type": "jsonp",
            "limit": 5
        },
        // data: {
        //     "name": "joao",
        //     "pass": "12345"
        // },
        headers: {
            Accept: 'application/json, text/javascript'
        },
        jsonp: 'callback',
        jsonpCallback: 'imdbapi'
    });

    // request.setParameter("search", "madonna");
    // request.setParameter("offset", 0);
    // request.setParameter("limit", 100);
    // request.setBodyParameter("limit", 100);
    // request.setTimeout(2000);

    request.success(function (res) {

        for (var i = 0; i < res.length; i += 1) {
            console.log(res[i].title);
        }
    });

    request.failure(function (req, res) {
        console.log("error", req, req.status, req.statusText);
    });

    request.send();
});