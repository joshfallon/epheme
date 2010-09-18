var eo_transform_stack = [];

function eo_transform() {
  var transform = {},
      actions = [];

  // TODO reorder elements
  // convenience method for replacing elements?
  // how to insert new element at a given location?
  // how to move elements around, sort, reverse or reorder?

  // TODO value transforms
  // how to inspect current attr/style/text value from transform?
  // perhaps push/pop values for temporary change (e.g., :hover)?
  // this.value retrieves current attr / style / text? or this.value()?

  // TODO extensibility
  // register hooks for transform extensibility outside the library?
  // how to encapsulate higher level logic (e.g., bars, wedges, charts)?
  // virtual nodes? map to canvas?

  // TODO composition
  // transform.apply(nodes) to transform specific nodes? (set root context)
  // transform.transform(transform) to chain transforms?

  // TODO selectors
  // allow select / selectAll argument to be function
  // allow select / selectAll argument to be node / nodes
  // allow select / selectAll argument to be xpath
  // allow selectParent?
  // allow selectFirstChild, selectLastChild, selectChildren?
  // allow selectNext, selectPrevious?

  // TODO transitions
  // eo.interpolate -> eo.tween
  // eo.interpolateRgb -> eo.tween.rgb? eo.rgb.tween?
  // implicit tweens from current -> target value
  // implicit tweens could use a 'setup' hook for attr / style / text?
  // how to do staggered transition on line control points? (virtual nodes?)

  function transform_scope(parent, actions) {
    var scope = Object.create(transform);

    scope.pop = parent;

    scope.data = function(v) {
      var subscope, action = {
        impl: eo_transform_data,
        value: v,
        actions: [],
        enterActions: [],
        exitActions: []
      };
      actions.push(action);
      subscope = transform_scope(scope, action.actions);
      subscope.enter = transform_scope(scope, action.enterActions);
      subscope.exit = transform_scope(scope, action.exitActions);
      subscope.key = function(n, v) {
        action.key = {name: ns.qualify(n), value: v};
        return subscope;
      };
      return subscope;
    };

    scope.attr = function(n, v) {
      actions.push({
        impl: eo_transform_attr,
        name: ns.qualify(n),
        value: v
      });
      return scope;
    };

    scope.style = function(n, v, p) {
      actions.push({
        impl: eo_transform_style,
        name: n,
        value: v,
        priority: arguments.length < 3 ? null : p
      });
      return scope;
    };

    scope.add = function(n, v) {
      var action = {
        impl: eo_transform_add,
        name: ns.qualify(n),
        value: v,
        actions: []
      };
      actions.push(action);
      return transform_scope(scope, action.actions);
    };

    scope.remove = function(s) {
      actions.push({
        impl: eo_transform_remove,
        selector: s
      });
      return scope;
    };

    scope.text = function(v) {
      actions.push({
        impl: eo_transform_text,
        value: v
      });
      return scope;
    };

    scope.on = function(t) {
      var action = {
        impl: eo_transform_on,
        type: t,
        actions: []
      };
      actions.push(action);
      return transform_scope(scope, action.actions);
    };

    scope.filter = function(f) {
      var action = {
        impl: eo_transform_filter,
        filter: f,
        actions: []
      };
      actions.push(action);
      return transform_scope(scope, action.actions);
    };

    scope.select = function(s) {
      var action = {
        impl: eo_transform_select,
        selector: s,
        actions: []
      };
      actions.push(action);
      return transform_scope(scope, action.actions);
    };

    scope.selectAll = function(s) {
      var action = {
        impl: eo_transform_select_all,
        selector: s,
        actions: []
      };
      actions.push(action);
      return transform_scope(scope, action.actions);
    };

    scope.transition = function() {
      var subscope, action = {
        impl: eo_transform_transition,
        actions: [],
        endActions: [],
        ease: eo.ease("cubic-in-out"),
        delay: 0,
        duration: 250
      };
      actions.push(action);
      subscope = transform_scope(scope, action.actions);
      subscope.end = transform_scope(scope, action.endActions);
      subscope.ease = function(x) {
        action.ease = typeof x == "string" ? eo.ease(x) : x;
        return subscope;
      };
      subscope.delay = function(x) {
        action.delay = x;
        return subscope;
      };
      subscope.duration = function(x) {
        action.duration = x;
        return subscope;
      };
      return subscope;
    };

    return scope;
  }

  transform.select = function(s) {
    var action = {
      impl: eo_transform_select,
      selector: s,
      actions: []
    };
    actions.push(action);
    return transform_scope(transform, action.actions);
  };

  transform.selectAll = function(s) {
    var action = {
      impl: eo_transform_select_all,
      selector: s,
      actions: []
    };
    actions.push(action);
    return transform_scope(transform, action.actions);
  };

  transform.apply = function() {
    eo_transform_stack.unshift(null);
    eo_transform_actions(actions, [{node: document, index: 0}]);
    eo_transform_stack.shift();
    return transform;
  };

  return transform;
}

eo.select = function(s) {
  return eo_transform().select(s);
};

eo.selectAll = function(s) {
  return eo_transform().selectAll(s);
};
