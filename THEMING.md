# Theming

If you think that you're custom styles would be appreciated but others too, you can submit your own theme as a pull-request!

## Creating a Theme

To create a theme simply create a `my-theme.theme.scss` file under `src/themes/`
and add your theme name as a wrapper around everything that you'll add.

```scss
/* src/themes/my-theme.theme.scss */

.my-theme {
  // Your styles here
}
```

To use your theme simply add the name of your theme in the config:

```yaml
theme: my-theme
```

## Variables

We are using [css-custom-properties](https://developer.mozilla.org/en-US/docs/Web/CSS/--*) for variables.

There are quite a few variables out there to make your life easier.
To see which ones are available please refer to the existing themes
or look in the dev-tools.

Please be very considerate when adding new variables as the trend
is going to be to have fewer variables than more
for maintainability purposes.

## Maintaining Your Theme

Unfortunately we can't guaranty that your theme is not going to break
when adding new features or options. But we'd like to encourage everyone
to create pull-requests to update and fix any issues with any of the themes.

