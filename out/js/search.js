(function($){
  var index;

  // Takes an array, and combines the elements, discarding duplicates
  Array.prototype.union = function(other){
    return !other ? this : other.concat(this.filter(function(val){ return other.indexOf(val) < 0; }));
  };

  // Takes an array, and keeps the common elements between itself and the other array
  Array.prototype.intersect = function(other){
    return !other ? this : this.filter(function(val){ return other.indexOf(val) >= 0; });
  };

  // Turns a string into search tokens
  String.prototype.tokenize = function(){
    return this.toLowerCase().replace(/[^\w ]/g, '').split(' ').filter(function(token){ return token.length > 0 });
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
      console.log(found.length, found);
    }).reduce(function(acc, i){ return acc.intersect(i); }, index.all); // Start with the full index

    // Show only items that were found
    $('.item-details').fastHide();
    $(found).fastShow();
    // Hide empty headers
    $('#eqContainer h1').each(function(){
      $(this).toggle($(this).nextUntil('h1').is(':not(.hidden)'));
    });
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
    var lastSearch = '';
    var $searchInput = $('<input>', {
      'id': 'search',
      'type': 'text',
      'placeholder': 'Search',
      'autocomplete': 'off',
      'name': 'q',
    }).on('keyup', function(e){
        var terms = $(this).val();
        if (lastSearch != terms || e.keyCode === 13) {
          lastSearch = terms;
          search($(this).val(), e.keyCode === 13);
        }
      })
      .prependTo('body');
    $('body').on('keydown', function(e){
      // Typing in the body will redirect to the input box
      // TODO printable characters only
      $('input').focus();
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
    if (state && state.q)
      $searchInput.val(state.q);
      search(state.q);
  });
})(jQuery);
