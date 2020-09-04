# Theming

You can submit your own themes as a pull request to make them available to all users.

## Creating a Theme

To create a theme simply create a `my-theme.theme.scss` file under `src/themes/`
and add a global class selector named after your theme.

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
Take a look at existing themes for a list of variables or check out
your browser's dev tools.
