$(function() {

  	Parse.$ = jQuery;

	Parse.initialize("9hrUXmV1BmRAt50W0xzLcLkuzta9Sm0Z9yMCuBth", "EscTObzRnv4pBjUcE4YFySxXKBC1sAb39aiDnu3t");

// GroceryItem
// ------------

  userQuery = new Parse.Query("User");
  users = []
  userQuery.find({success:function(allUsers){
    users = allUsers;
  }});



  // Our basic Todo model has `content`, `order`, and `done` attributes.
  var GroceryItem = Parse.Object.extend("GroceryItem", {
    // Default attributes for the todo.
    defaults: {
      name: "...",
      done: false
    },

    // Ensure that each todo created has `content`.
    initialize: function() {
      if (!this.get("name")) {
        this.set({"name": this.defaults.name});
      }
    },

    // Toggle the `done` state of this todo item.
    toggle: function() {
      this.save({done: !this.get("done")});
    }
  });

  var GroceryItemList = Parse.Collection.extend({

    // Reference to this collection's model.
    model: GroceryItem,

  });

  // The DOM element for a todo item...
  var GroceryItemView = Parse.View.extend({

    //... is a list tag.
    tagName:  "li",

    // Cache the template function for a single item.
    template: _.template($('#item-template').html()),

    // The DOM events specific to an item.
    events: {
      "click .toggle"              : "toggleDone",
      "dblclick label.todo-content" : "edit",
      "click .todo-destroy"   : "clear",
      "keypress .edit"      : "updateOnEnter",
      "blur .edit"          : "close"
    },

    // The TodoView listens for changes to its model, re-rendering. Since there's
    // a one-to-one correspondence between a Todo and a TodoView in this
    // app, we set a direct reference on the model for convenience.
    initialize: function() {
      _.bindAll(this, 'render', 'close', 'remove');
      this.model.bind('change', this.render);
      this.model.bind('destroy', this.remove);
    },

    // Re-render the contents of the todo item.
    render: function() {
      $(this.el).html(this.template(this.model.toJSON()));
      this.input = this.$('.edit');
      return this;
    },

    // Toggle the `"done"` state of the model.
    toggleDone: function() {
      this.model.toggle();
    },

    // Switch this view into `"editing"` mode, displaying the input field.
    edit: function() {
      $(this.el).addClass("editing");
      this.input.focus();
    },

    // Close the `"editing"` mode, saving changes to the todo.
    close: function() {
      this.model.save({name: this.input.val()});
      $(this.el).removeClass("editing");
    },

    // If you hit `enter`, we're through editing the item.
    updateOnEnter: function(e) {
      if (e.keyCode == 13) this.close();
    },

    // Remove the item, destroy the model.
    clear: function() {
      this.model.destroy();
    }
  });

// GroceryList
// -----------
  var GroceryList = Parse.Object.extend("GroceryList", {
    // Default attributes for the todo.
    defaults: {
      store: "store TBD",
    },

    // Ensure that each todo created has `content`.
    initialize: function() {
      if (!this.get("store")) {
        this.set({"store": this.defaults.store});
      }
    },

  });

  var GroceryListCollection = Parse.Collection.extend({

    // Reference to this collection's model.
    model: GroceryList,

  });

  var GroceryListView = Parse.View.extend({

    //... is a list tag.
    tagName:  "li",

    // Cache the template function for a single item.
    template: _.template($('#view-list-template').html()),

    // The DOM events specific to an item.
    events: {
      "click .toggle"              : "toggleDone",
      "dblclick label.todo-content" : "edit",
      "click .todo-destroy"   : "clear",
      "keypress .edit"      : "updateOnEnter",
      "blur .edit"          : "close"
    },

    // The TodoView listens for changes to its model, re-rendering. Since there's
    // a one-to-one correspondence between a Todo and a TodoView in this
    // app, we set a direct reference on the model for convenience.
    initialize: function() {
      _.bindAll(this, 'render', 'close', 'remove');
      this.model.bind('change', this.render);
      this.model.bind('destroy', this.remove);
    },

    // Re-render the contents of the todo item.
    render: function() {
      $(this.el).html(this.template(this.model.toJSON()));
      this.input = this.$('.edit');
      return this;
    },

    // Toggle the `"done"` state of the model.
    toggleDone: function() {
      this.model.toggle();
    },

    // Switch this view into `"editing"` mode, displaying the input field.
    edit: function() {
      $(this.el).addClass("editing");
      this.input.focus();
    },

    // Close the `"editing"` mode, saving changes to the todo.
    close: function() {
      this.model.save({content: this.input.val()});
      $(this.el).removeClass("editing");
    },

    // If you hit `enter`, we're through editing the item.
    updateOnEnter: function(e) {
      if (e.keyCode == 13) this.close();
    },

    // Remove the item, destroy the model.
    clear: function() {
      this.model.destroy();
    }

  });

  var ManageGroceryListsView = Parse.View.extend({

    // Delegated events for creating new items, and clearing completed ones.
    events: {
      "click .log-out": "logOut",
      "click ul#filters a": "selectFilter",
      "click .new-list": "newList"

    },

    el: ".content",

    initialize: function() {
      var self = this;

      _.bindAll(this, 'addOne', 'addAll', 'addSome', 'render', 'logOut');

      // Main todo management template
      this.$el.html(_.template($("#manage-lists-template").html()));
      
      this.lists = new GroceryListCollection;
      this.lists.query = new Parse.Query(GroceryList); // base query

      // ELP
      this.lists.bind('add',     this.addOne);
      this.lists.bind('reset',   this.addAll);
      this.lists.bind('all',     this.render);

      // Fetch all the todo items for this user
      this.lists.fetch();

      state.on("change", this.filter, this);
    },

    // Logs out the user and shows the login view
    logOut: function(e) {
      Parse.User.logOut();
      new LogInView();
      this.undelegateEvents();
      delete this;
    },

    // Re-rendering the App just means refreshing the statistics -- the rest
    // of the app doesn't change.
    render: function() {
      this.delegateEvents();
    },

    // Filters the list based on which type of filter is selected
    selectFilter: function(e) {
      var el = $(e.target);
      var filterValue = el.attr("id");
      state.set({filter: filterValue});
      Parse.history.navigate(filterValue);
    },

    filter: function() {
      console.debug("filter");
      this.addAll();
    },

    // Resets the filters to display all todos
    resetFilters: function() {
    },

    newList:function() {
      self = this;
      console.debug("newlist");
          new EditListView(null);
          self.undelegateEvents();
          delete self;  // Without this when we submit in the other form it can't watch the events
    },

    addOne: function(gl) {
      console.debug("addOne!", gl)
      var view = new GroceryListView({model: gl});
      this.$("#lists").append(view.render().el);
    },

    addAll: function(collection, filter) {
      console.debug("addall");
      this.$("#lists").html("");
      this.lists.each(this.addOne);
    },

    // Only adds some todos, based on a filtering function that is passed in
    addSome: function(filter) {
      var self = this;
      this.$("#lists").html("");
      this.lists.chain().filter(filter).each(function(item) { self.addOne(item) });
    },
  });

  var EditListView = Parse.View.extend({
    events: {
      "submit form.edit-list-form": "saveList",
      "keypress #new-todo":  "createOnEnter",
      "click #clear-completed": "clearCompleted",
      "click #toggle-all": "toggleAllComplete",
      "click .log-out": "logOut",
      "click ul#filters a": "selectFilter",
      "keypress #users-input": "addUser",
      "click #new-item-button": "addNewItem",
    },

    el: ".content",
    
    initialize: function(existingList) {
      this.list = existingList;
      if (null != existingList) {
        this.store = existingList.store;
        this.addItems(); // ELP find id from existing list
      } else {
        this.store = "...";
        this.items = null;
      }

      store = this.store;
      this.$el.html(_.template($("#edit-lists-template").html()));

      _.bindAll(this, 'saveList', 'addOne', 'addAll', 'addSome', 'render', 'toggleAllComplete', 'logOut', 'createOnEnter');

      this.render();
    },

    addNewItem: function(item) {
      var newItemText = $("#new-item-text").val();
      this.items.create({
        ACL:  this.list.getACL(),
        name: newItemText,
      })
      $("#new-item-text").val("");
    },

    addUser: function(e) {
      if (e.keyCode != 13) 
        return;

      var user = $("#users-input").val();
      // find id for selected user

      var userId = null;
      for(var i=0; i<users.length;i++) {
        console.debug(users[i].get("username"), user)
        if(user === users[i].get("username")) {
          console.debug("???")
          userId = users[i].id;
        }
      }

      if(null != userId) {
        acl = this.list.getACL();
        acl.setWriteAccess(userId, true);
        this.list.setACL(acl);
        this.list.save({success:function(e){
          $("#users-message-div").html('<div class="alert alert-success">List successfully shared with  \'' + user + '\'.<a href="#" class="close" data-dismiss="alert">&times;</a></div>');
        }});

        this.items.each(function(item){item.setACL(acl); item.save();});
      } else {
      }
    },

    addItems: function(listName) {
      this.$("#edit-creation").hide();
      this.$("#edit-after").show();

      $('#users-input').typeahead({source:function(query,process){ return users.map(function(u){return u.get("username");});}});

      this.items = new GroceryItemList;

      // Setup the query for the collection to look for todos from the current user
      this.items.query = new Parse.Query(GroceryItem);
      this.items.query.equalTo("list", this.store);  // ELP switch to pointer later

      this.items.bind('add',     this.addOne);
      this.items.bind('reset',   this.addAll);
      this.items.bind('all',     this.render);

      // Fetch all the todo items for this user
      this.items.fetch();

      state.on("change", this.filter, this);
    },

    saveList: function(e) {
      console.debug("saveList: EditListView");

      var self = this;
      var store = this.$("#list-store").val();
      var acl = new Parse.ACL()
      acl.setWriteAccess(Parse.User.current(), true);

      var gl = new GroceryList();
      gl.save({store: store, ACL: acl}, {
      success: function(savedList) {
        self.list = savedList;
        self.store = savedList.get("store");
        self.addItems(savedList);
        self.render();
      },
      error: function(model, error) {
        // ELP
      }});

      this.$(".edit-list-form button").attr("disabled", "disabled");

      return false;
    },

    render: function() {
      console.debug("ELV render");

      if (null != this.items) {
        this.$(".edit-list-form #items").show();
        action = "Edit";
      } else {
        action = "New"
      }

      store = this.store;


      this.delegateEvents();
    },

// ELP C&P from example

    // Logs out the user and shows the login view
    logOut: function(e) {
      Parse.User.logOut();
      new LogInView();
      this.undelegateEvents();
      delete this;
    },


    // Filters the list based on which type of filter is selected
    selectFilter: function(e) {
      var el = $(e.target);
      var filterValue = el.attr("id");
      state.set({filter: filterValue});
      Parse.history.navigate(filterValue);
    },

    filter: function() {
      var filterValue = state.get("filter");
      this.$("ul#filters a").removeClass("selected");
      this.$("ul#filters a#" + filterValue).addClass("selected");
      if (filterValue === "all") {
        this.addAll();
      } else if (filterValue === "completed") {
        this.addSome(function(item) { return item.get('done') });
      } else {
        this.addSome(function(item) { return !item.get('done') });
      }
    },

    // Resets the filters to display all todos
    resetFilters: function() {
      this.$("ul#filters a").removeClass("selected");
      this.$("ul#filters a#all").addClass("selected");
      this.addAll();
    },

    // Add a single todo item to the list by creating a view for it, and
    // appending its element to the `<ul>`.
    addOne: function(todo) {
      var view = new GroceryItemView({model: todo});
      console.debug(view);
      this.$("#items").append(view.render().el);
    },

    // Add all items in the Todos collection at once.
    addAll: function(collection, filter) {
      console.debug("Adding all: ", this.items);
      this.$("#items").html("");
      this.items.each(this.addOne);
    },

    // Only adds some todos, based on a filtering function that is passed in
    addSome: function(filter) {
      var self = this;
      this.$("#items").html("");
      this.todos.chain().filter(filter).each(function(item) { self.addOne(item) });
    },

    // If you hit return in the main input field, create new Todo model
    createOnEnter: function(e) {
      var self = this;
      if (e.keyCode != 13) return;

      this.todos.create({
        content: this.input.val(),
        order:   this.todos.nextOrder(),
        done:    false,
        user:    Parse.User.current(),
        ACL:     new Parse.ACL(Parse.User.current())
      });

      this.input.val('');
      this.resetFilters();
    },

    // Clear all done todo items, destroying their models.
    clearCompleted: function() {
      _.each(this.todos.done(), function(todo){ todo.destroy(); });
      return false;
    },

    toggleAllComplete: function () {
      var done = this.allCheckbox.checked;
      this.todos.each(function (todo) { todo.save({'done': done}); });
    }


  });


  // LOG IN RELATED
  // --------------
  var LogInView = Parse.View.extend({
    events: {
      "submit form.login-form": "logIn",
      "submit form.signup-form": "signUp"
    },

    el: ".content",
    
    initialize: function() {
      _.bindAll(this, "logIn", "signUp");
      this.render();
    },

    logIn: function(e) {
      var self = this;
      var username = this.$("#login-username").val();
      var password = this.$("#login-password").val();
      
      Parse.User.logIn(username, password, {
        success: function(user) {
          new ManageGroceryListsView();
          self.undelegateEvents();
          delete self;
        },

        error: function(user, error) {
          self.$(".login-form .error").html("Invalid username or password. Please try again.").show();
          this.$(".login-form button").removeAttr("disabled");
        }
      });

      this.$(".login-form button").attr("disabled", "disabled");

      return false;
    },

    signUp: function(e) {
      var self = this;
      var username = this.$("#signup-username").val();
      var password = this.$("#signup-password").val();
      
      acl = new Parse.ACL()
      acl.setPublicReadAccess(true) // Make public so we can find user ID's by querying the table

      Parse.User.signUp(username, password, { ACL: acl }, {
        success: function(user) {
          new ManageTodosView();
          self.undelegateEvents();
          delete self;
        },

        error: function(user, error) {
          self.$(".signup-form .error").html(error.message).show();
          this.$(".signup-form button").removeAttr("disabled");
        }
      });

      this.$(".signup-form button").attr("disabled", "disabled");

      return false;
    },

    render: function() {
      this.$el.html(_.template($("#login-template").html()));
      this.delegateEvents();
    }
  });



  // This is the transient application state, not persisted on Parse
  var AppState = Parse.Object.extend("AppState", {
    defaults: {
      filter: "all"
    }
  });

  // The main view for the app
  var AppView = Parse.View.extend({
    // Instead of generating a new element, bind to the existing skeleton of
    // the App already present in the HTML.
    el: $("#bhtb"),

    initialize: function() {
      this.render();
    },

    render: function() {
      if (Parse.User.current()) {
        new ManageGroceryListsView();
      } else {
        new LogInView();
      }
    }
  });

  var AppRouter = Parse.Router.extend({
    routes: {
      "all": "all",
      "active": "active",
      "completed": "completed"
    },

    initialize: function(options) {
    },

    all: function() {
      state.set({ filter: "all" });
    },

    active: function() {
      state.set({ filter: "active" });
    },

    completed: function() {
      state.set({ filter: "completed" });
    }
  });

  var state = new AppState;

  new AppRouter;
  new AppView;
  Parse.history.start();

});