var print = console.log;

var USE_LIX = Boolean(getUrlParameter("lix"));
var USE_PIX = !USE_LIX; // if they don't tell us to use LIX, we will default to PIX

function chunkify(a, n, out, balanced) {
    if (n < 2) {
        out.push(a.slice());
        return out;
    }

    var len = a.length,
        i = 0,
        size;

    if (len % n === 0) {
        size = Math.floor(len / n);
        while (i < len) {
            out.push(a.slice(i, i += size));
        }
    }
    else if (balanced) {
        while (i < len) {
            size = Math.ceil((len - i) / n--);
            out.push(a.slice(i, i += size));
        }
    }

    else {

        n--;
        size = Math.floor(len / n);
        if (len % size === 0)
            size--;
        while (i < size * n) {
            out.push(a.slice(i, i += size));
        }
        out.push(a.slice(size * n))

    }

    return out;
}

$(document).ready(function() {
    // Broadcast Program Generation

    // Order the pages from hottest to coldest, we will call this the "main disk"
    var pages = [];
    pages.length = getUrlParameter("pages", 6);

    var randomSum = 0;
    for(var i = 0; i < pages.length; i++) {
        pages[i] = {
            id: asLetter(i),
            P: Math.random(),   // Probability of Access
            X: 0,               // Frequency of Broadcast
            PIX: NaN,
        };

        randomSum += pages[i].P;
    }

    var $pages = $("#pages");
    function updatePages() {
        for(var i = 0; i < pages.length; i++) {
            var d = pages[i];
            var $d = $("#data-" + d.id);
            for(var key in d) {
                $("." + key, $d).html(d[key]);
            }
        }
    };

    for(var i = 0; i < pages.length; i++) {
        var page = pages[i];
        page.P = page.P / randomSum;
        var $row = $("<tr>")
            .attr("id", "data-" + page.id)
            .append($("<td>").addClass("id"))
            .append($("<td>").addClass("P"))
            .append($("<td>").addClass("X"))
            .append($("<td>").addClass("PIX"));

        $pages.append($row);
    }

    updatePages();

    var disks = [];
    disks.length = getUrlParameter("disks", 2);

    var maxChunks = 0;
    var maxLoop = 0;
    while(maxLoop++ < 100) {
        for(var i = 0; i < disks.length; i++) {
            var disk = [];
            disk.id = "DISK_" + i;
            disks[i] = disk;
        }

        // now assign each item in disk to an element in disks
        for(var i = 0; i < pages.length; i++) {
            var page = pages[i];
            var disk = disks.randomElement();
            page.disk = disk;

            // TODO: disk freq
            disk.push(page);
        }

        // now calculate relative freqs as a divisor of their lengths
        var freqs = [];
        for(var i = 0; i < disks.length; i++) {
            var disk = disks[i];
            disk.relativeFrequency = randomInt(1, 5);//divisors(disk.length).randomElement();
            freqs.push(disk.relativeFrequency);
        }

        var invalid = false;
        maxChunks = LCM(freqs);
        for(var i = 0; i < disks.length; i++) {
            var disk = disks[i];
            disk.numberChunks = maxChunks / disk.relativeFrequency;

            if(disk.numberChunks > disk.length) { // slides don't say how to handle more chunks than items... all examples are less than
                invalid = true;
                break;
            }
        }

        if(!invalid) {
            break;
        }
    }

    var $disks = $("#disks");

    // create the chunks
    for(var i = 0; i < disks.length; i++) {
        var disk = disks[i];

        disk.chunks = chunkify(disk, disk.numberChunks, [], true);

        var $chunky = $("<div>")
            .addClass("chunky")
            .attr("id", "chunky-disk-" + i);
        for(var j = 0; j < disk.chunks.length; j++) {
            var chunk = disk.chunks[j];
            chunk.id = j;
            var $chunk = $("<td>").appendTo(
                $("<tr>").appendTo(
                    $("<table>").appendTo(
                        $chunky
                    )
                )
            );

            for(var k = 0; k < chunk.length; k++) {
                var page = chunk[k];
                page.chunk = chunk;

                $chunk.append($("<td>")
                    .html(page.id)
                );
            }
        }

        var $tr = $("<tr>").attr("id", "disk-" + i);

        for(var j = 0; j < disk.length; j++) {
            var page = disk[j];
            $tr.append($("<td>")
                .addClass(page.id)
                .addClass(page.chunk.id)
                .html(page.id));
        }

        $disks.append(
            $("<li>").append(
                $('<table class="disk">').append(
                    $tr
                )
            ).append(
               $chunky
            )
        );
    }

    // create the broadcast disk
    var chunkyBroadcastDisk = [];
    for(var i = 0; i < maxChunks; i++) {
        for(var j = 0; j < disks.length; j++) {
            var disk = disks[j];
            var k = i % disk.numberChunks;
            var chunk = disk.chunks[k];
            chunkyBroadcastDisk.push(chunk);

            for(var c = 0; c < chunk.length; c++) {
                chunk[c]._ready = true;
            }
        }

        var ready = true;
        for(var p = 0; p < pages.length; p++) {
            if(!pages[p]._ready) {
                ready = false;
                break;
            }
        }

        if(ready) {
            break
        }
    }

    var $broadcastDisk = $("#broadcast-disk");
    var broadcastDisk = []; // the actual, useful broadcast disk with chunks "flattened"
    for(var i = 0; i < chunkyBroadcastDisk.length; i++) {
        var chunk = chunkyBroadcastDisk[i];
        for(var j = 0; j < chunk.length; j++) {
            var page = chunk[j];
            broadcastDisk.push(page);

            $broadcastDisk.append($("<td>")
                .attr("id", "broadcast-" + page.id)
                .addClass(page.disk.id)
                .html(page.id)
            );
        }
    }

    // PIX/LIX //

    var $clientRequests = $("#client-requests");

    var clientRequests = [];
    clientRequests.length = getUrlParameter("clients", 5);

    for(var i = 0; i < clientRequests.length; i++) {
        var c = {
            page: pages.randomElement(),
            fullfilled: false,
        };

        clientRequests[i] = c;

        c.$element = $("<td>")
            .attr("id", "client-request-" + i)
            .html(c.page.id)
            .appendTo($clientRequests);
    }

    var cached = [];
    cached.length = getUrlParameter("caches", 1);

    var $cached = $("#cached");
    for(var i = 0; i < cached.length; i++) {
        $cached.append($("<td>")
            .attr("id", "cached-" + i)
        );
    }

    var broadcasts = 0;

    // during this we broadcast something, and may cache it, then move to the next item in the broadcast dist, this will depend on PIX vs LIX setting
    function broadcast(page) {
        broadcasts++;

        page.X++;
        page.PIX = page.P / page.X;

        var last = cached.last();
        if(!last || (last.PIX < page.PIX && cached.indexOf(page) < 0)) {
            cached.pop();
            cached.push(page);

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

        updatePages();
    }


    var currentIndex = -1;
    var clientIndex = 0;
    var clientRequest = clientRequests[0];

    // called when the click next, mostly handles the html emements
    function next() {
        currentIndex++;
        if(currentIndex >= broadcastDisk.length) {
            currentIndex = 0;
        }

        var broadcasting = broadcastDisk[currentIndex];

        broadcast(broadcasting);

        while(clientRequest && (clientRequest.page === broadcasting ||  cached.indexOf(clientRequest.page) > -1)) {
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
