var eaTemplating = {
    templates: [],

    initialize: function () {
        eaTemplating.templates['error'] = Handlebars.compile($("#error-template").html());

        $.get("partials/special-rules.html").done(function (template) {
            Handlebars.registerPartial('special-rules', template);
        });

        $.get("partials/card-with-margin.html").done(function (template) {
            Handlebars.registerPartial('card-with-margin', template);
        });

        $.get("partials/weapons.html").done(function (template) {
            Handlebars.registerPartial('weapons', template);
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
            if (isNaN(value))
            {
                return value;
            }
            else
            {
                return value + suffix;
            }
        });

        Handlebars.registerHelper('upgrade', function (context, options) {
            if (options.data)
            {
                var data = Handlebars.createFrame(options.data);
                data.options = context.options !== undefined ? context.options.length : 0;
            }

            return options.fn(context, {data: data})
        });

        Handlebars.registerHelper('hasSpecialNotes', function (value) {
            return value !== undefined && (value.specialRules !== undefined || value.notes !== undefined || value.crit !== undefined);
        });

        Handlebars.registerHelper('unit', function (context, options) {
            if (options.data)
            {
                var data = Handlebars.createFrame(options.data);

                var count = 0;
                for (weapon in context.weapons)
                {
                    count += context.weapons[weapon].modes.length;
                }

                data.weaponLines = count;
                data.hasNotes = context.notes || context.specialRules;
                data.hasNoNotes = !data.hasNotes;
                data.singleLine = count == 1 && data.hasNoNotes;
            }

            return options.fn(context, {data: data})
        });
    }
};
