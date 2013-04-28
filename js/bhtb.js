$(function() {

  	Parse.$ = jQuery;

	Parse.initialize("9hrUXmV1BmRAt50W0xzLcLkuzta9Sm0Z9yMCuBth", "EscTObzRnv4pBjUcE4YFySxXKBC1sAb39aiDnu3t");

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
      "keypress #new-todo":  "createOnEnter",
      "click .log-out": "logOut",
      "click ul#filters a": "selectFilter"
    },

    el: ".content",

    initialize: function() {
      var self = this;

      _.bindAll(this, 'addOne', 'addAll', 'addSome', 'render', 'logOut', 'createOnEnter');

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

    editList:function(gl) {
      console.debug("editlist");
    },

    newList:function() {
      console.debug("newlist");
          new ManageTodosView();
          self.undelegateEvents();
          // delete self; // ELP
    }

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

    // If you hit return in the main input field, create new Todo model
    createOnEnter: function(e) {
      var self = this;
      if (e.keyCode != 13) return;

      this.lists.create({
        content: this.input.val(),
//        order:   this.todos.nextOrder(),
//        done:    false,
        user:    Parse.User.current(),
//        ACL:     new Parse.ACL(Parse.User.current())
      });

      this.input.val('');
      this.resetFilters();
    },

  });


  var EditListView = Parse.View.extend({
    events: {
      "submit form.edit-list-form": "edit",
    },

    el: ".content",
    
    initialize: function() {
      _.bindAll(this, "edit");
      this.render();
    },

    edit: function(e) {
      console.debug("edit");
      var self = this;
      var store = this.$("#list-store").val();
      
      acl = new Parse.ACL()
      acl.setPublicReadAccess(true) // Make public so we can find user ID's by querying the table

      Parse.User.signUp(username, password, { ACL: acl }, {
        success: function(user) {
          new ManageGroceryListsView();
          self.undelegateEvents();
          delete self;
        },

        error: function(user, error) {
          // ELP
          self.$(".edit-list-form .error").html(error.message).show();
          this.$(".edit-list-form button").removeAttr("disabled");
        }
      });

      this.$(".edit-list-form button").attr("disabled", "disabled");

      return false;
    },

    render: function() {
      this.$el.html(_.template($("#edit-list-form").html()));
      this.delegateEvents();
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