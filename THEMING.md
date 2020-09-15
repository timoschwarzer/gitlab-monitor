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

Enable your theme in your configuration to see your changes:

```yaml
theme: my-theme
```

## Variables

Themes use [CSS Custom Properties](https://developer.mozilla.org/en-US/docs/Web/CSS/--*) for variables.

There are quite a few variables out there to make theme development easier.
Take a look at existing themes for a list of variables or check out
your browser's dev tools.
