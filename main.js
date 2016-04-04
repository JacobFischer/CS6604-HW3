var print = console.log;

var USE_LIX = Boolean(getUrlParameter("lix"));
var USE_PIX = !USE_LIX; // if they don't tell us to use LIX, we will default to PIX
var UPDATE_PIX = Boolean(getUrlParameter("updatePIX"));
var UNIFORM = getUrlParameter("uniform");

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
    var CACHE_STRATEGY = USE_LIX ? "LIX" : "PIX";
    var $cacheStrategy = $(".cache-strategy").html(CACHE_STRATEGY);

    var CONST_C = 0.5;
    if(USE_PIX) {
        $("#c").hide();
    }
    else {
        $("#c-value").html(CONST_C);
    }

    // Broadcast Program Generation

    // Order the pages from hottest to coldest, we will call this the "main disk"
    var pages = [];
    pages.length = getUrlParameter("pages", USE_LIX ? 10 : 6);

    var randomSum = 0;
    for(var i = 0; i < pages.length; i++) {
        pages[i] = {
            id: asLetter(i),
            P: Math.random(),   // Probability of Access
            X: 0,               // Frequency of Broadcast
            PIX: NaN,

            t: 0,               // last time indexed, start at 0 according to slides
            p: 0,               // last calculated p
            LIX: 0,
        };

        randomSum += pages[i].P;
    }

    var $pages = $("#pages");

    if(USE_PIX) {
        $cacheStrategy
            .before(
                $("<th>P</th>")
            )
            .before(
                $("<th>X</th>")
            );
    }
    else {
        $cacheStrategy
            .before(
                $("<th>t</th>")
            )
            .before(
                $("<th>p</th>")
            );
    }

    var $pageHeaders = $("th", $pages);

    function updatePages() {
        for(var i = 0; i < pages.length; i++) {
            var page = pages[i];
            for(var key in page) {
                if(!key.startsWith("$")) {
                    $("." + key, page.$row).html(page[key]);
                }
            }
        }
    };

    for(var i = 0; i < pages.length; i++) {
        var page = pages[i];
        page.P = page.P / randomSum;
        var $row = $("<tr>")
            .attr("id", "page-" + page.id);

        page.$row = $row;

        for(var j = 0; j < $pageHeaders.length; j++) {
            var $th = $($pageHeaders[j]);
            $row.append($("<td>").addClass($th.html()));
        }

        $pages.append($row);
    }

    updatePages();

    var disks = [];
    disks.length = getUrlParameter("disks", 2);

    var maxChunks = 0;
    var maxLoop = 0;
    while(maxLoop++ < 200) {
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
        var allOneChunks = true;
        for(var i = 0; i < disks.length; i++) {
            var disk = disks[i];
            disk.numberChunks = maxChunks / disk.relativeFrequency;

            if(disk.numberChunks > disk.length) { // slides don't say how to handle more chunks than items... all examples are less than
                invalid = true;
                break;
            }

            if(UNIFORM) {
                if(disk.length % disk.numberChunks !== 0) {
                    invalid = true;
                    break;
                }

                allOneChunks = allOneChunks && disk.numberChunks === 1;
            }
        }

        if(UNIFORM && allOneChunks) {
            invalid = true;
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

        var $li = $("<li>")
            .append($("<header>")
                .addClass(disk.id)
                .html("Disk " + i)
            )
            .append('<div class="disk-p">')
            .append(
                $('<table class="disk">').append(
                    $tr
                )
            ).append(
               $chunky
            );

        if(USE_LIX) {
            disk.f = disk.numberChunks;
            $(".disk-p", $li).html("f = " + disk.f);
        }

        $disks.append($li);
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
            break;
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

    // our broadcast disk is now complete, so let's back fill X for all pages
    if(!UPDATE_PIX) {
        for(var i = 0; i < broadcastDisk.length; i++) {
            var page = broadcastDisk[i];
            page.X += 1/broadcastDisk.length;
            page.PIX = page.P / page.X;
        }
        updatePages();
    }

    // update all pages color coded
    for(var i = 0; i < pages.length; i++) {
        var page = pages[i];
        page.$row.addClass(page.disk.id);
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

    var $cached = $("#cached");

    var diskCaches = [];
    var diskCachesNum = USE_PIX ? 1 : disks.length;
    var maxCacheLength = getUrlParameter("caches", USE_LIX ? 3 : 1);
    var currentCache = undefined; // will be a cache in diskCaches
    for(var i = 0; i < diskCachesNum; i++) {
        var cache = [];
        cache.length = maxCacheLength;
        var index = 0;
        if(USE_LIX) {
            index = disks[i].id;
        }

        diskCaches[index] = cache;
        currentCache = currentCache || cache;

        cache.$tr = $("<tr>")
            .attr("id", "disk-cache-" + i)
            .appendTo($cached);

        if(USE_LIX) {
            cache.$tr.append($("<td>Disk " + i + "</td>"));
        }

        for(var j = 0; j < cache.length; j++) {
            $("<td>")
                .appendTo(cache.$tr)
                .addClass("cached-" + j);
        }
    }

    function sortCurrentCache() {
        currentCache.sort(function(a, b) {
            if(!b && !a) {
                return 0;
            }

            if(!b) {
                return -1;
            }

            if(!a) {
                return 1;
            }

            return b[CACHE_STRATEGY] - a[CACHE_STRATEGY];
        });
    };

    // during this we broadcast something, and may cache it, then move to the next item in the broadcast dist, this will depend on PIX vs LIX setting
    var currentTime = 0;
    function broadcast(page) {
        currentTime++;

        if(UPDATE_PIX) {
            page.X++;
            page.PIX = page.P / page.X;
        }

        currentCache = diskCaches[USE_PIX ? 0 : page.disk.id];

        if(USE_PIX) {
            var last = currentCache.last();
            if(!last || (last.PIX < page.PIX && currentCache.indexOf(page) < 0)) {
                currentCache.pop();
                currentCache.push(page);

                sortCurrentCache();
            }
        }
        else { // use lix
            // re-calculate p
            page.p = (CONST_C / (currentTime - page.t)) + (1 - CONST_C) * page.p;
            page.t = currentTime;
            page.LIX = page.p / page.disk.f;

            // now move that page to the top of the cache
            currentCache.removeElement(page);

            sortCurrentCache();

            if(currentCache.length === maxCacheLength) {
                currentCache.pop(); // too long, need to remove the lowest LIX value
            }

            currentCache.unshift(page);



            // now sort the remaining elements based on their LIX value
        }

        for(var i = 0; i < currentCache.length; i++) {
            var c = currentCache[i];
            $(".cached-" + i, currentCache.$tr).html(c ? c.id : "-");
        }

        $("#current-time").html(currentTime);
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

        while(clientRequest && (clientRequest.page === broadcasting ||  currentCache.indexOf(clientRequest.page) > -1)) {
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
