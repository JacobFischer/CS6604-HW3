var print = console.log;

$(document).ready(function() {
    var numDatas = getUrlParameter("datas", 5);

    var $accessPriorities = $("#access-priorities");
    var datas = [];
    var randomSum = 0;
    for(var i = 0; i < numDatas; i++) {
        var d = {
            id: String.fromCharCode("A".charCodeAt(0) + i),
            P: Math.random(),   // Probability of Access
            X: 0,               // Frequency of Broadcast
            PIX: NaN,
        };

        randomSum += d.P;

        datas.push(d);
    }

    function updateDatas() {
        for(var i = 0; i < datas.length; i++) {
            var d = datas[i];
            var $d = $("#data-" + d.id);
            for(var key in d) {
                $("." + key, $d).html(d[key]);
            }
        }
    };

    for(var i = 0; i < numDatas; i++) {
        var b = datas[i];
        b.P = b.P / randomSum;
        var $row = $("<tr>")
            .attr("id", "data-" + b.id)
            .append($("<td>").addClass("id"))
            .append($("<td>").addClass("P"))
            .append($("<td>").addClass("X"))
            .append($("<td>").addClass("PIX"));

        $accessPriorities.append($row);
    }

    updateDatas();

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
    clientRequests.length = getUrlParameter("clients", 5);

    for(var i = 0; i < clientRequests.length; i++) {
        var c = {
            data: datas.randomElement(),
            fullfilled: false,
        };

        clientRequests[i] = c;

        c.$element = $("<td>")
            .attr("id", "client-request-" + i)
            .html(c.data.id)
            .appendTo($clientRequests);
    }

    var cached = [];
    cached.length = getUrlParameter("cache", 1);

    var $cached = $("#cached");
    for(var i = 0; i < cached.length; i++) {
        $cached.append($("<td>")
            .attr("id", "cached-" + i)
        );
    }

    var broadcasts = 0;
    function broadcast(data) {
        broadcasts++;

        data.X++;
        data.PIX = data.P / data.X;

        var last = cached.last();
        if(!last || last.PIX < data.PIX) {
            cached.pop();
            cached.push(data);

            cached.sort(function(a, b) {
                if(!b && !a) {
                    return 0;
                }

                if(!b) {
                    return -1;
                }

                if(!a) {
                    return 1;
                }

                return b.PIX - a.PIX;
            });
        }

        for(var i = 0; i < cached.length; i++) {
            var c = cached[i];
            $("#cached-" + i).html(c ? c.id : "-");
        }

        updateDatas();
    }


    var currentIndex = -1;
    var clientIndex = 0;
    var clientRequest = clientRequests[0];

    function next() {
        currentIndex++;
        if(currentIndex >= broadcastDisk.length) {
            currentIndex = 0;
        }

        var broadcasting = broadcastDisk[currentIndex];

        broadcast(broadcasting);

        while(clientRequest && (clientRequest.data === broadcasting ||  cached.indexOf(clientRequest.data) > -1)) {
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
