// Test "template aware" client-side components from within a simulated browser.
//
// The client-side template handling requires a server to provide the template content.
//
// We have to load this via a `gpii.express` instance because file URLs don't work on windows:
//
// https://github.com/assaf/zombie/issues/915
//
"use strict";
var fluid = fluid || require("infusion");

var gpii  = fluid.registerNamespace("gpii");

var jqUnit  = fluid.require("jqUnit");
var Browser = require("zombie");

require("gpii-express");
require("../../");
require("./zombie-test-harness");

// We will reuse a function from the rendering tests to confirm that the component is doing its work.
require("./zombie-rendering-tests");

fluid.registerNamespace("gpii.templates.tests.client.templateAware");

gpii.templates.tests.client.templateAware.runTests = function (that) {

    jqUnit.module("Testing templateAware component...");

    jqUnit.asyncTest("Use Zombie.js to verify that the templateAware component is rendered...", function () {
        var browser = Browser.create();
        browser.on("error", function (error) {
            jqUnit.start();
            jqUnit.fail("There should be no errors:" + error);
        });
        browser.visit(that.options.config.express.baseUrl + "content/tests-templateAware.html").then(function () {
            // The client side has already manipulated a bunch of stuff by the time we see it, we're just inspecting the results.
            jqUnit.start();

            // Reuse the rendering tests to confirm that the templateAware wiring is correct
            var viewport = browser.window.$(".viewport");
            gpii.templates.tests.client.render.commonTests(that, viewport, browser.window.$);

            var contained = browser.window.$(".contained");
            jqUnit.assertTrue("Content outside of the inner container should not have been disturbed...", contained.html().indexOf("This content should not be overwritten.") !== -1);
            jqUnit.assertTrue("The original content of the inner container should have been updated...", contained.html().indexOf("A place for everything, and everything in its place.") !== -1);
        });
    });
};

var templateAwareComponent = gpii.templates.tests.client.harness({
    "expressPort" :   6895,
    "baseUrl":        "http://localhost:6895/",
    expected: {
        myvar:    "modelvariable",
        markdown: "*this works*",
        json:     { foo: "bar", baz: "quux", qux: "quux" }
    },
    listeners: {
        "{express}.events.onStarted": {
            funcName: "gpii.templates.tests.client.templateAware.runTests",
            args:     ["{that}"]
        }
    }
});
module.exports = templateAwareComponent.promise;
