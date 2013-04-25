/**
 * Showtime plugin to watch dailymotion shows
 *
 * Copyright (C) 2013 Anthony Dahanne
 *
 *     This file is part of Dailymotion Showtime plugin.
 *
 *  dailymotion Showtime plugin is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  dailymotion Showtime plugin is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with dailymotion Showtime plugin.  If not, see <http://www.gnu.org/licenses/>.
 *
 *  Download from : https://github.com/anthonydahanne/showtime-plugin-dailymotion
 *
 */

(function(plugin) {

  var PLUGIN_PREFIX = "dailymotion:";
  var DAILYMOTION_SEARCH_URL = "https://api.dailymotion.com/videos?fields=channel,description,created_time,duration,id,owner,thumbnail_medium_url,title&sort=visited&limit=100&localization=en_EN&search=";
  var DAILYMOTION_SEQUENCE_URL = "http://www.dailymotion.com/sequence/";


  // Register a service (will appear on home page)
  var service = plugin.createService("dailymotion", PLUGIN_PREFIX+"start", "tv", true, plugin.path + "dailymotion.png");

  // register the settings
  var settings = plugin.createSettings("dailymotion",
    plugin.path + "dailymotion.png",
    "Showtime plugin to watch RadioCanada's dailymotion shows (Unofficial)");

  settings.createInfo("info",
    plugin.path + "dailymotion.png",
    "\n"+
      "Dailymotion Showtime plugin is the integration of the website dailymotion into Showtime.");

  // Add a responder to the registered start URI
  plugin.addURI(PLUGIN_PREFIX+"start", function(page) {
      page.metadata.title = 'Dailymotion Search';

//      page.metadata.logo = plugin.path + "views/img/logos/music.png";
      pageMenu(page, null, null);

      page.metadata.search = "";
      page.subscribe("page.model.metadata.search", function(v) {
        page.metadata.search = v;
      });
      page.appendAction("navopen", PLUGIN_PREFIX + "feed:" + escape(page.metadata.search), true, { title: "Search for Videos", icon: plugin.path + "views/img/search_videos.png", hidden: true, search: true });
//      page.appendAction("navopen", PLUGIN_PREFIX + ":feed:" + escape("https://gdata.youtube.com/feeds/api/playlists/snippets?q=" + page.metadata.search), true, { title: "Search for Playlists", icon: plugin.path + "views/img/search_playlists.png", hidden: true, search: true });
//      page.appendAction("navopen", PLUGIN_PREFIX + ":feed:" + escape("https://gdata.youtube.com/feeds/api/channels?q=" + page.metadata.search), true, { title: "Search for Channels", icon: plugin.path + "views/img/search_channels.png", hidden: true, search: true });
//      page.appendAction("navopen", PLUGIN_PREFIX + ":disco:" + escape(page.metadata.search), true, { title: "Disco", icon: plugin.path + "views/img/logos/music.png", hidden: true, search: true });

      page.metadata.glwview = plugin.path + "views/search.view";

      page.type = "directory";
      page.contents = "items";
      page.loading = false;
    });

  // Add a responder to the registered emission URI
  plugin.addURI(PLUGIN_PREFIX+"feed:(.*)", function(page,search) {
    showtime.trace("Getting search term : " + search);
    page.type = "directory";
    page.metadata.title = "Search results";

    showtime.trace("Getting results list : " + DAILYMOTION_SEARCH_URL + search);
    var searchResult = showtime.httpGet(DAILYMOTION_SEARCH_URL + search);

    var results = showtime.JSONDecode(searchResult);
    for each (var result in results.list) {
//      showtime.trace("description" + showtime.entityDecode(result.description));
      var description = result.description;
      if(result.description !== null) {
        description = result.description.replace(/<(?:.|\n)*?>/gm, '');
      }
      var metadata = {
        title: result.title,
        description: description,
        year: parseInt(result.created_time / (60*60*24*365)) + 1970,
        duration: result.duration,
        icon: result.thumbnail_medium_url
      };
      page.appendItem(PLUGIN_PREFIX + "video:" + result.id, "video", metadata);
    }
    page.loading = false;
  });

  function getUrl(sequence, urlType) {
    var videoUrlAndEnd = sequence.substring(sequence.indexOf(urlType));
    var videoUrl = decodeURIComponent(videoUrlAndEnd.substring(videoUrlAndEnd.indexOf(":") + 2, videoUrlAndEnd.indexOf(",") - 1));
    videoUrl =  videoUrl.replace(/\\/g,"");
    if(videoUrl.indexOf("http") !== -1) {
      return videoUrl;
    }
    return null;

  }

  plugin.addURI(PLUGIN_PREFIX+"video:(.*)", function(page, id) {
    showtime.trace("Getting episode metadata before playing : " + DAILYMOTION_SEQUENCE_URL + id);
    var sequenceResponse = showtime.httpGet(DAILYMOTION_SEQUENCE_URL + id);
    var sequence = sequenceResponse.toString();

    var customURL = getUrl(sequence, "customURL");
    showtime.trace("customURL : "+customURL);
    var hd1080URL = getUrl(sequence, "hd1080URL");
    showtime.trace("hd1080URL : "+hd1080URL);
    var hd720URL = getUrl(sequence, "hd720URL");
    showtime.trace("hd720URL : "+hd720URL);
    var hqURL = getUrl(sequence, "hqURL");
    showtime.trace("hqURL : "+hqURL);
    var sdURL = getUrl(sequence, "sdURL");
    showtime.trace("sdURL : "+sdURL);
    var videoUrl = getUrl(sequence, "video_url");
    showtime.trace("video_url : "+videoUrl);
    if(customURL !== null) {
      videoUrl = customURL;
    } else if(hd1080URL !== null) {
      videoUrl = hd1080URL;
    } else if(hd720URL !== null) {
      videoUrl = hd720URL;
    } else if(hqURL !== null) {
      videoUrl = hqURL;
    } else if(sdURL !== null) {
      videoUrl = sdURL;
    }
    showtime.trace("Playing this videoUrl : "+videoUrl);
    if(videoUrl != null ) {
      page.type = 'video';
      page.source = videoUrl;
    }
    page.loading = false;
  });




  function getValue(url, start_string, end_string)
  {
    var begin_temp = url.indexOf(start_string) + start_string.toString().length;
    var end_temp = url.indexOf(end_string, begin_temp);

    var string = url.slice(begin_temp, end_temp);
    return unescape(string);
  }


  function sort(items, field, reverse) {
    if (items.length == 0) return null;

    var its = [];
    for (var i in items) {
      items[i].orig_index = i;
      its.push(items[i]);
    }

    its.sort(function(a,b){return b[field] > a[field]});
    if (reverse) its.reverse();

    return its;
  }

  function pageUpdateItemsPositions(its) {
    for (var i in its) {
      items[its[i].orig_index].moveBefore(i);
    }
  }

  function pageMenu(page) {
    //page.metadata.background = ui.background;
    page.metadata.background = plugin.path + "views/img/background.png";
    page.metadata.backgroundAlpha = 0.5;

    //page.metadata.font = "default";

    page.appendAction("navopen", PLUGIN_PREFIX + ":search", true, { title: "Search", icon: plugin.path + "views/img/search.png" });
    page.appendAction("pageevent", "sortDateDec", true, { title: "Sort by Date (Decrementing)", icon: plugin.path + "views/img/sort_date_dec.png" });
    page.appendAction("pageevent", "sortViewsDec", true, { title: "Sort by Views (Decrementing)", icon: plugin.path + "views/img/sort_views_dec.png" });
    page.appendAction("pageevent", "sortAlphabeticallyInc", true, { title: "Sort Alphabetically (Incrementing)", icon: plugin.path + "views/img/sort_alpha_inc.png" });
    page.appendAction("pageevent", "sortAlphabeticallyDec", true, { title: "Sort Alphabetically (Decrementing)", icon: plugin.path + "views/img/sort_alpha_dec.png" });
    page.appendAction("pageevent", "sortDefault", true, { title: "Sort as Default", icon: plugin.path + "views/img/sort_default.png" });

    var sorts = [
      ["sortAlphabeticallyInc", "Alphabetically (A->Z)"],
      ["sortAlphabeticallyDec", "Alphabetically (Z->A)"],
      ["sortViewsDec", "Views (decrementing)"],
      ["sortDateDec", "Published (decrementing)"],
      ["sortDefault", "Default", true]
    ];

    page.options.createMultiOpt("sort", "Sort by...", sorts, function(v) {
      eval(v + "()");
    });

    function sortAlphabeticallyInc() {
      var its = sort(items, "title", true);
      pageUpdateItemsPositions(its);
    }

    function sortAlphabeticallyDec() {
      var its = sort(items, "title", false);
      pageUpdateItemsPositions(its);
    }

    function sortViewsDec() {
      var its = sort(items, "views", false);
      pageUpdateItemsPositions(its);
    }

    function sortDateDec() {
      var its = sort(items, "date", false);
      pageUpdateItemsPositions(its);
    }

    function sortDefault() {
      for (var i in items_tmp) {
        items[i].moveBefore(items_tmp[i].orig_index);
      }
    }

    page.onEvent('sortAlphabeticallyInc', function() {
      sortAlphabeticallyInc();
    });

    page.onEvent('sortAlphabeticallyDec', function() {
      sortAlphabeticallyDec();
    });

    page.onEvent('sortViewsDec', function() {
      sortViewsDec();
    });

    page.onEvent('sortDateDec', function() {
      sortDateDec();
    });

    page.onEvent('sortDefault', function() {
      sortDefault();
    });
  }


})(this);
