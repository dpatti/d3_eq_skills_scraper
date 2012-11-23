(function($){
  var index,
      $window = $(window);

  // Takes a time in ms, will only execute after that time has passed without calls
  Function.prototype.debounce = function(ms){
    var timer,
        fn = this;

    return function(){
      var context = this,
          args = arguments;
      if (timer)
        clearTimeout(timer);
      timer = setTimeout(function(){
        fn.apply(context, args);
      }, ms);
    };
  };

  // Takes an array, and combines the elements, discarding duplicates
  Array.prototype.union = function(other){
    return !other ? this : other.concat(this.filter(function(val){ return other.indexOf(val) < 0; }));
  };

  // Takes an array, and keeps the common elements between itself and the other array
  Array.prototype.intersect = function(other){
    return !other ? this : this.filter(function(val){ return other.indexOf(val) >= 0; });
  };

  // Returns last element in array
  Array.prototype.last = function(){
    return this[this.length - 1];
  };

  // Turns a string into search tokens
  String.prototype.tokenize = function(){
    return this.toLowerCase().replace(/[^\w ]/g, '').split(' ').filter(function(token){ return token.length > 0 });
  };

  // Turns a string into a slug for a class name
  String.prototype.slug = function(){
    return this.toLowerCase().replace(/[^\w]/g, ' ').trim().replace(/\s+/g, '-');
  };

  // Hide by moving off the screen
  $.fn.fastHide = function(){
    $(this).css({
      position: 'absolute',
      left: -10000,
    }).addClass('hidden');
  };

  // Show by moving onto the screen
  $.fn.fastShow = function(){
    $(this).css({
      position: '',
      left: '',
    }).removeClass('hidden');
  };

  // Emulating the 'flick' scrolling of touch interfaces
  $.fn.kinetic = (function(){
    var defaults = {
      update: function(top){ $(this).scrollTop($(this).scrollTop() + top); },
      decay: .85,
      boost: 1,
    };
    var position = function(e){
      return { x: e.clientX, y: e.clientY };
    };
    return function(options){
      $(this).each(function(){
        var dragging = null,
            sliding = null,
            keypoints = [],
            $this = $(this);
        options = $.extend({}, defaults, options);
        $this.on('mousedown', function(e){
          $this.addClass('dragging');
          // Reset keypoints
          keypoints = [position(e)];
          // Stop sliding
          clearInterval(sliding);
          dragging = setInterval(function(){
            // Push a new time onto the keypoints stack and keep the last 5
            keypoints = keypoints.concat($.extend({}, keypoints.last())).slice(-5);
          }, 100);
        });
        $this.on('mousemove', function(e){
          if (!dragging) return;
          // Update live scroll
          options.update.call($this, e.clientY - keypoints.last().y);
          // Update the most recent keypoint
          $.extend(keypoints.last(), position(e));
        });
        $window.on('mouseup', function(e){
          if (!dragging) return;
          // Stop the dragging timer and calculate inertia
          clearInterval(dragging);
          dragging = null;
          // Add our current position
          keypoints.push(position(e));
          // Currently only doing y-direction, but can be extended for x
          var inertia = options.boost * (keypoints.last().y - keypoints[0].y) / (keypoints.length - 1);
          if (!inertia) {
            // No inertia means we should allow click events
            $this.removeClass('dragging');
            return;
          }
          sliding = setInterval(function(){
            inertia *=  options.decay;
            if (Math.abs(inertia) < 1)
              clearInterval(sliding);
            options.update.call($this, inertia);
          }, 10);
          // Remove dragging class on next frame to prevent any click events
          setTimeout(function(){
            $this.removeClass('dragging');
          }, 0);
        });
      });
    };
  })();

  // History management
  var History = {
    // Whether browser supports replace/pushState
    hasState: typeof history.replaceState === 'function',

    // Navigate to a search term -- returns true if search should continue
    search: function(query) {
      if (this.hasState) {
        history.replaceState(query, '', this.param(query));
      } else {
        document.location.search = query;
      }
    },

    param: function(query) {
      return document.location.origin + document.location.pathname + '?' + $.param(query);
    },

    // Initialize from a popstate or a page load
    load: function() {
      var search;
      // Try browser state
      if (this.hasState) {
        search = history.state;
      }
      // Use query string if it doesn't exist
      if (!search) {
        var query = document.location.search;
        search = {};
        query.slice(1).split('&').forEach(function(term){
          var pair = term.split('=');
          search[pair[0]] = decodeURIComponent(pair[1]).replace(/\+/g, ' ');
        });
      }
      return search;
    }
  };

  // Search handler
  function search(terms, navigate) {
    // Update location if you press enter or if we can do so without reloading
    if (navigate || History.hasState) {
      History.search({q: terms});
    }

    // Token string and search for tokens. Find items that match all tokens.
    // We want to iterate over the tokens and then over the indices. We build a
    // union for each term, then intersect them to find the result.
    var found = terms.tokenize().map(function(term){
      if (!term)
        return null;
      var result = [];
      for (var table in index)
        if (index[table].find)
          result = result.union(index[table].find(term));
      return result;
    }).reduce(function(acc, i){ return acc.intersect(i); }, index.all); // Start with the full index

    // Show only items that were found
    $('.item-details').fastHide();
    $(found).fastShow();
    // Hide empty headers
    $('#eqContainer h1').each(function(){
      $(this).toggle($(this).nextUntil('h1').is(':not(.hidden)'));
    });
    // Render navigation
    render_nav();
  }

  // Refresh for nav list
  function render_nav() {
    $nav = $('#eqNavlist');
    $nav.children().remove();

    $('#eqContainer').show();
    var items = $('#eqContainer').children().filter(':not(.hidden)').filter(':visible').map(function(){
      if ($(this).is('h1')) {
        // List header navs
        var text = $(this).text(),
            slug = text.slug();
        $(this).attr('id', slug);
        return $nav.find('li.header.' + slug).get(0) ||
          $('<li>', { 'class': 'header' })
            .addClass(slug)
            .append($('<a>', { 'href': '#'+slug }).prop('draggable', false).text(text))
            .get(0)
      } else {
        // Item navs
        var text = $(this).find('.subcategory').text(),
            slug = text.slug();
        $(this).attr('id', slug);
        return $nav.find('li.item.' + slug).get(0) ||
          $('<li>', { 'class': 'item' })
            .addClass(slug)
            .append($('<a>', { 'href': '#'+slug }).prop('draggable', false).text(text))
            .get(0);
      }
    });
    $nav
      .children()
        .remove()
      .end()
      .append(items);
    $window.scrollspy('refresh').scrollspy('process');
  }

  // Enum type
  var Enum = function(symbols) {
    var i = 0;
    var lookup = {}
    // Given an array of items, each one gets an integer
    symbols.forEach(function(set){
      // If we were not given an array, use one
      if (!(set instanceof Array))
        set = [set];
      // Each item in the array will be equivalent
      set.forEach(function(symbol){
        lookup[symbol] = i;
      });
      i++;
    });
    // Return a function that lets us look up a symbol
    return function(val){
      return lookup[val] || null;
    };
  };
  // Item quality
  var Quality = Enum([
    ['m', 'magic'],
    ['r', 'rare'],
    ['l', 'lengend', 'legendary'],
    ['s', 'set'],
  ]);

  // Index various elements
  var Index = (function() {
    var Index = function(cast, invalidator) {
      this.cast = cast;
      this.invalidator = invalidator;
      this.lookup = {};
    };

    Index.prototype.invalid = function(term) {
      if (typeof this.invalidator === 'function') {
        return this.invalidator.call(term);
      } else {
        return this.invalidator === term;
      }
    };

    // Add an element to the set
    Index.prototype.add = function(element, selector, filter){
      var self = this;
      $(element).find(selector).text().tokenize().forEach(function(key){
        key = self.cast(key);
        if (self.invalid(key))
          return;
        if (!self.lookup.hasOwnProperty(key))
          self.lookup[key] = [];
        if (self.lookup[key].indexOf(element) === -1)
          self.lookup[key].push(element);
      });
    };

    // Find an element within the set
    Index.prototype.find = function(term) {
      var results = [];
      term = this.cast(term);
      if (this.invalid(term))
        return results;
      for (var key in this.lookup)
        // It is a match if numerical term is greater than key or a partial match to key
        if ((typeof term === 'number' && key >= term) || key.indexOf(term) >= 0)
          results = results.union(this.lookup[key]);
      return results;
    };

    return Index;
  })();
  index = {
    all: [],
    level: new Index(Number, function(){ return isNaN(this); }),
    type: new Index(String, String()),
    name: new Index(String, String()),
    quality: new Index(Quality, null),
    // Not yet implemented
    // cat: new Index(),
    // props: new Index(),
  };

  $(function(){
    // Create elements
    var lastSearch = '', $nav, $searchInput;

    $searchInput = $('<input>', {
      'id': 'search',
      'type': 'text',
      'placeholder': 'Search',
      'autocomplete': 'off',
      'name': 'q',
    }).on('keyup', (function(e){
        var terms = $(this).val();
        if (lastSearch != terms || e.keyCode === 13) {
          lastSearch = terms;
          search($(this).val(), e.keyCode === 13);
        }
      }).debounce(500))
      .prependTo('body');
    $('body').on('keydown', function(e){
      if (e.keyCode == 27) // ESC - focus input
        $('input').focus().select();
      else if (e.keyCode == 38) // UP - prev item
        $nav.find('.active:first').prevAll('.item:first').find('a').trigger('click', [true]);
      else if (e.keyCode == 40) // DOWN - next item
        $nav.find('.active:last').nextAll('.item:first').find('a').trigger('click', [true]);
      else
        return;
      e.preventDefault();
    });

    // Create scrollspy jumplist
    $nav = $('<ul>', { 'id': 'eqNavlist', 'class': 'nav' }).insertBefore($('#eqContainer'));
    // Click handlers on a
    $nav.on('click', 'a', function(e, quick){
      e.stopPropagation();
      e.preventDefault();
      if ($nav.is('.dragging'))
        return;

      var $el = $(this.hash);
      if ($el.length == 0)
        return;

      $('body').animate({ scrollTop: $el.position().top - 60 }, quick ? 50 : 400);
    });
    $window.scrollspy({ offset: 61 }); // One more than scroll animation below
    // Position jumplist based on page scroll
    $window.on('scroll', function(){
      // Depending on which index list item is active, scroll accordingly
      // at index = 0, top = 0
      // at index = max, top = window.height - nav.height
      // Current active index and total number of items
      var index = $nav.find('.active').index(),
          max = $nav.children().length - 1,
          // Range of scrollTop values
          range = Math.min(0, $window.height() - $nav.outerHeight(true)),
          // For sub-item rendering (smooth scrolling between items), we figure
          // out how far we are between the active item and the next item.
          current = $window.data('scrollspy').offsets[index],
          next = $window.data('scrollspy').offsets[index + 1] || current
          // Add the proportion of how far down the list we are to the
          // proportion of how far down this item we are to get the % of
          // scrollTop we should use.
          partial = (current < next) ? ($window.scrollTop() - current) / (next - current) : 0,
          loc = (index / max) + (1 / max) * partial;
      $nav.css('top', range * loc);
    });
    // Drag scroll on the nav
    $nav.kinetic({
      update: function(v) {
        // Inverse scrolling is a bit more difficult than the above. We're just
        // going to make our flick scroll the main window with a multiplier
        var multiplier = 15,
            top_bound = 0,
            bottom_bound = $(document).height() - $window.height(),
            bounded = Math.max(top_bound, Math.min(bottom_bound, $window.scrollTop() - v * multiplier));
        $window.scrollTop(bounded);
      },
    });
    
    // Initialize index
    $('.item-details').each(function(){
      // Get item level, type, name, and possible properties
      index.all.push(this);
      index.level.add(this, '.item-ilvl .value');
      index.type.add(this, '.item-type span');
      index.name.add(this, '.subcategory');
      // index.quality.add(this, '.
    });

    // Initialize history
    var state = History.load();
    if (state && state.q) {
      $searchInput.val(state.q);
      search(state.q);
    } else {
      render_nav();
    }
  });
})(jQuery);
