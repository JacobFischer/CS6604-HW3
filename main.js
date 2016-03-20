$(document).ready(function() {
    var numDatas = getUrlParameter("datas", 5);

    var $accessPriorities = $("#access-priorities");
    var datas = [];
    var randomSum = 0;
    for(var i = 0; i < numDatas; i++) {
        var d = {
            id: String.fromCharCode("A".charCodeAt(0) + i),
            P: Math.random(),
            X: undefined,
        };

        randomSum += d.P;

        datas.push(d);
    }

    for(var i = 0; i < numDatas; i++) {
        var b = datas[i];
        b.P = b.P / randomSum;
        $accessPriorities.append($("<li>")
            .attr("id", b.id)
            .html(b.id + ": P(" + b.id + ") = " + b.P + ", X(" + b.id + ") = " + b.X + ", PIX(" + b.id + ") = " + (b.P / b.X))
        );
    }

    var clientLength = getUrlParameter("length", 5);

    var $broadcastDisk = $("#broadcast-disk");
    var $clientRequests = $("#client-requests");

    var broadcastDisk = [];

    var maxLoop = 0;
    while(++maxLoop < 100) { // will break out once broadcastDisk has all datas in it
        var b = datas.randomElement();
        broadcastDisk.push(b);

        $broadcastDisk.append($("<td>")
            .attr("id", "broadcast-" + b.id)
            .html(b.id)
        );

        var broadcasting = {};
        for(var i = 0; i < broadcastDisk.length; i++) {
            broadcasting[broadcastDisk[i].id] = true;
        }

        var cont = false;
        for(var i = 0; i < datas.length; i++) {
            if(!broadcasting[datas[i].id]) {
                cont = true;
                break;
            }
        }

        if(!cont) {
            break;
        }
    }

    if(maxLoop >= 100) {
        return alert("MAX LOOP!");
    }

    var clientRequests = [];

    for(var i = 0; i < clientLength; i++) {
        var c = {
            data: datas.randomElement(),
            fullfilled: false,
        };

        clientRequests.push(c);

        c.$element = $("<td>")
            .attr("id", "client-request-" + i)
            .html(c.data.id)
            .appendTo($clientRequests);
    }

    var cached = undefined;
    var currentIndex = -1;
    var clientIndex = 0;
    var clientRequest = clientRequests[0];

    function next() {
        currentIndex++;
        if(currentIndex >= broadcastDisk.length) {
            currentIndex = 0;
        }

        var broadcasting = broadcastDisk[currentIndex];

        while(clientRequest && (clientRequest.data === broadcasting || clientRequest.data === cached)) {
            clientRequest.fullfilled = true;
            clientRequest = clientRequests[++clientIndex];
        }

        // update html elements

        var bs = $broadcastDisk.children();
        for(var i = 0; i < bs.length; i++) {
            var $bs = $(bs[i]);
            $bs.toggleClass("current", i === currentIndex);
        }

        var allFullfilled = true;
        for(var i = 0; i < clientRequests.length; i++) {
            var r = clientRequests[i];
            var ful = r.fullfilled;
            r.$element.toggleClass("fullfilled", r.fullfilled)
            allFullfilled = allFullfilled && r.fullfilled;
        }

        if(allFullfilled) {
            $("#done").html("DONE!");
        }
    };

    $("#next"). on("click", next);
});
