#### Portfolio 2.0

Welcome to my Portfolio 2.0 repo. Site has been built with Create-React-App, in combination with React-Bootstrap and SASS. 

## Technology Choices

* React: The project was built using React, a JavaScript library known for its efficiency and flexibility. React's component-based architecture was leveraged to create reusable components, enhancing the maintainability and readability of the code. The Home component, for instance, maps over a list of projects and dynamically generates a section for each one. This dynamic rendering is a key feature of React, allowing for efficient updates and rendering of components.

* React Router: React Router was used to implement navigation between different sections of the website (Home, About, Contact). This provides a smooth user experience and allows users to easily access different parts of the portfolio.

* Bootstrap: Bootstrap, a popular CSS framework, was used for advanced styling. React-Bootstrap package provides pre-built components and utilities that can expedite development and ensure a consistent look and feel. However, the main styles are defined in SCSS for more granular control.

* SASS: The website was styled using SCSS, a CSS preprocessor that introduces useful features such as variables, nesting, and mixins. These features were used extensively to create a consistent theme across the website and to write DRY (Don't Repeat Yourself) code. The main styles are defined in main.scss, while the mixins and variables are defined in _mixins.scss and _variables.scss respectively.

* Typewriter Effect: The Typewriter effect for the main description was achieved using the Typewriter component from the typewriter-effect package. This adds a dynamic, interactive feel to the website.

## Presentation and Responsiveness

I designed the website with a mobile-first approach, ensuring it looks good and functions well on all device sizes. I used React-Bootsrap flexbox extensively to create a responsive layout that adjusts based on the viewport size. Media queries were used to apply different styles at different breakpoints, guaranteeing a smooth user experience across all devices.

The use of CSS animations, such as the loading animation for the project images, also contributes to the site's responsiveness. These animations are triggered when the images are loaded, providing a smooth transition and enhancing the user experience.

## Website Performance

Website performance was a key consideration throughout the development process. I implemented best practices such as code splitting, and efficient use of React's re-rendering to ensure a fast and smooth user experience. Dynamic media queries were achieved with React-Responsive and manual media queries for SCSS were implemented aswell. 

Scores from Pagespeed (desktop/mobile):

* Performance (desktop/mobile): 95 / 61
* Accesibility (desktop/mobile): 94 / 86
* Best practices (desktop/mobile): 100 / 100
* SEO (desktop/mobile): 100 / 100