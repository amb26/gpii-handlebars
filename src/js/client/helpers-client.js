// A client-side extension of the template handling module.  Brings in the client-side dependencies and wires them in to the general helper grade.
//
// Also provides DOM-manipulation functions that are completely unique to the client side.
//
// Requires Handlebars.js and Pagedown (for markdown rendering)
(function ($) {
    "use strict";   
    var namespace     = "gpii.templates.hb.client";
    var helpersClient = fluid.registerNamespace(namespace);


    helpersClient.initConverter = function(that) {
        if (Markdown && Markdown.getSanitizingConverter) {
            var converter = Markdown.getSanitizingConverter();
            that.applier.change("converter", converter);
        }
        else {
            console.error("Pagedown or one of its dependencies is not available, so markdown will be passed on without any changes.");
        }
        
        if (Handlebars) {
            Handlebars.registerHelper("md", that.md);
            Handlebars.registerHelper("jsonify", that.jsonify);
        }
        else {
            console.error("Handlebars is not available, so we cannot wire in our helpers.")
        }
    };

    helpersClient.render = function(that, key, context) {
        // TODO:  Convert to "that-ism" where we use locate() instead of $(selector)
        // If a template exists, load that.  Otherwise, try to load the partial.
        var element = $("#partial-" + key).length ? $("#partial-" + key) : $("#template-" + key);

        // Cache each compiled template the first time we use it...
        if (that.model.compiled[key]) {
            return that.model.compiled[key](context);
        }
        else {
            if (!element || !element.html()) {
                console.log("Template '" + key + "' does not have any content. Skipping");
                return;
            }

            var template = Handlebars.compile(element.html());
            that.model.compiled[key] = template;
            return template(context);
        }
    };

    helpersClient.passthrough = function(that, element, key, context, manipulator) {
        element[manipulator](helpersClient.render(that, key, context));
    };

    ["after","append","before","prepend","replaceWith", "html"].forEach(function(manipulator){
        helpersClient[manipulator] = function(that, element, key, context) {
            helpersClient.passthrough(that, element, key, context, manipulator);
        };
    });

    helpersClient.appendToBody = function (that, data, textStatus, jqXHR) {
        // TODO:  Replace this with a {that} reference?
        $("body").append(data);

        helpersClient.loadPartials();

        // Fire a "templates loaded" event so that components can wait for their markup to appear.
        that.events.templatesLoaded.fire();
    };

    helpersClient.loadPartials  = function() {
        // load all partials so that we can use them in context
        $("[id^=partial-]").each(function(index, element) {
            var id = element.id;
            var key = id.substring(id.indexOf("-")+1);
            Handlebars.registerPartial(key,$("#" + id).html());
        });
    };

    helpersClient.loadTemplates = function(that, callback){
        var settings = {
            url:     that.model.templateUrl,
            success: that.appendToBody
        };
        if (callback) {
            $.ajax(settings).then(callback);
        }
        else {
            $.ajax(settings);
        }
    };

    fluid.defaults(namespace,{
        gradeNames: ["fluid.standardRelayComponent","gpii.templates.hb.helpers", "autoInit"],
        model: {
            compiled:    {},
            templateUrl: "/hbs"
        },
        invokers: {
            "after": {
                funcName: namespace + ".after",
                args: ["{that}", "{arguments}.0", "{arguments}.1", "{arguments}.2", "{arguments}.3"]
            },
            "append": {
                funcName: namespace + ".append",
                args: ["{that}", "{arguments}.0", "{arguments}.1", "{arguments}.2", "{arguments}.3"]
            },
            "appendToBody": {
                funcName: namespace + ".appendToBody",
                args: ["{that}", "{arguments}.0", "{arguments}.1", "{arguments}.2"]
            },
            "before": {
                funcName: namespace + ".before",
                args: ["{that}", "{arguments}.0", "{arguments}.1", "{arguments}.2", "{arguments}.3"]
            },
            "body": {
                funcName: namespace + ".body",
                args: ["{that}", "{arguments}.0", "{arguments}.1", "{arguments}.2", "{arguments}.3"]
            },
            "html": {
                funcName: namespace + ".html",
                args: ["{that}", "{arguments}.0", "{arguments}.1", "{arguments}.2", "{arguments}.3"]
            },
            "loadPartials": {
                funcName: namespace + ".loadPartials"
            },
            "loadTemplates": {
                funcName: namespace + ".loadTemplates",
                args: ["{that}", "{arguments}.0"]
            },
            "prepend": {
                funcName: namespace + ".prepend",
                args: ["{that}", "{arguments}.0", "{arguments}.1", "{arguments}.2", "{arguments}.3"]
            },
            "replaceWith": {
                funcName: namespace + ".replaceWith",
                args: ["{that}", "{arguments}.0", "{arguments}.1", "{arguments}.2", "{arguments}.3"]
            }
        },
        events: {
            "templatesLoaded": null
        },
        listeners: {
            onCreate: [
                {
                    funcName: namespace + ".initConverter",
                    args: ["{that}"]
                }
            ]

        }
    });
})(jQuery);


