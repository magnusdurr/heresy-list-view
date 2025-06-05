var eaTemplating = {
    templates: [],
    specialRulesData: {},

    initialize: function () {
        eaTemplating.templates['error'] = Handlebars.compile($("#error-template").html());
        
        // Load special rules data
        $.get("lists/specialRules.json").done(function (data) {
            // Create a lookup map for quick access by rule name
            eaTemplating.specialRulesData = {};
            if (data.rules) {
                data.rules.forEach(function(rule) {
                    eaTemplating.specialRulesData[rule.title] = rule;
                });
            }
        });

        $.get("partials/special-rules.html").done(function (template) {
            Handlebars.registerPartial('special-rules', template);
        });

        $.get("partials/card-with-margin.html").done(function (template) {
            Handlebars.registerPartial('card-with-margin', template);
        });

        $.get("partials/weapons.html").done(function (template) {
            Handlebars.registerPartial('weapons', template);
        });

        $.get("partials/upgrade.html").done(function (template) {
            Handlebars.registerPartial('upgrade', template);
        });

        $.get("templates/army.html").done(function (template) {
            eaTemplating.templates['army'] = Handlebars.compile(template);
        });

        $.get("templates/units.html").done(function (template) {
            eaTemplating.templates['units'] = Handlebars.compile(template);
        });

        $.get("templates/list.html").done(function (template) {
            eaTemplating.templates['list'] = Handlebars.compile(template);
        });

        Handlebars.registerHelper('appendPlural', function (number) {
            return number > 1 ? "s" : "";
        });

        Handlebars.registerHelper('numberAsText', function (number, capitalize) {
            function toText(number) {
                if (number === 1) {
                    return "one";
                } else if (number === 2) {
                    return "two";
                } else if (number === 3) {
                    return "three";
                } else if (number === 4) {
                    return "four";
                } else if (number === 5) {
                    return "five";
                } else if (number === 6) {
                    return "six";
                } else if (number === 7) {
                    return "seven";
                } else if (number === 8) {
                    return "eight";
                } else if (number === 9) {
                    return "nine";
                } else if (number === 10) {
                    return "ten";
                }
            }

            const word = toText(number)
            return capitalize ? word.charAt(0).toUpperCase() + word.slice(1) : word;
        });

        Handlebars.registerHelper('oddEven', function (index) {
            return index % 2 === 0 ? 'even' : 'odd';
        });

        Handlebars.registerHelper('eq', function (v1, v2) {
            return v1 === v2;
        });

        Handlebars.registerHelper('not', function (v1, v2) {
            return v1 !== v2;
        });

        Handlebars.registerHelper('and', function (one, two) {
            return true === one && true === two;
        });

        Handlebars.registerHelper('isArray', function (object) {
            return $.isArray(object);
        });

        Handlebars.registerHelper('appendOnNumber', function (value, suffix) {
            if (isNaN(value)) {
                return value;
            } else {
                return value + suffix;
            }
        });

        Handlebars.registerHelper('upgrade', function (context, options) {
            if (options.data) {
                var data = Handlebars.createFrame(options.data);
                data.options = context.options !== undefined ? context.options.length : 0;
            }

            return options.fn(context, {data: data})
        });

        Handlebars.registerHelper('hasSpecialNotes', function (value) {
            return value !== undefined && (value.specialRules !== undefined || value.notes !== undefined || value.crit !== undefined);
        });

        Handlebars.registerHelper('unit', function (context, options) {
            if (options.data) {
                var data = Handlebars.createFrame(options.data);

                var count = 0;
                for (weapon in context.weapons) {
                    count += context.weapons[weapon].modes.length;
                }

                data.weaponLines = count;
                data.hasNotes = context.notes || context.specialRules;
                data.hasNoNotes = !data.hasNotes;
                data.singleLine = count == 1 && data.hasNoNotes;
            }

            return options.fn(context, {data: data})
        });

        Handlebars.registerHelper('specialRuleTooltip', function (ruleName) {
            var rule = eaTemplating.specialRulesData[ruleName];
            if (rule && rule.description) {
                // Join description paragraphs with double line breaks for better formatting
                var description = rule.description.join('\n\n');
                // Remove HTML tags for tooltip (since we're using plain text)
                description = description.replace(/<[^>]*>/g, '');
                // Escape quotes for HTML attribute
                description = description.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
                return new Handlebars.SafeString(
                    '<span class="special-rule-tooltip" data-tooltip="' + description + '">' + ruleName + '</span>'
                );
            }
            return ruleName;
        });
    }
};
