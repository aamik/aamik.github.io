// Select all anchor tags within elements with the class 'links-box'
document.querySelectorAll(".links-box a").forEach((link) => {
  // Add a click event listener to each link
  link.addEventListener("click", function (e) {
    // Prevent the default action of the event (in this case, following the link)
    e.preventDefault();

    // Select various elements on the page
    const header = document.querySelector(".header");
    const headerH1 = document.querySelector(".header-h1");
    const linksBox = document.querySelector(".links-box");
    const page = document.querySelector(".page");

    // Get the section that corresponds to the clicked link
    const section = document.querySelector(this.getAttribute("href"));
    const content = section.querySelector(".content");

    // Add classes to certain elements when a link is clicked
    header.classList.add("sticky");
    headerH1.classList.add("smaller");
    linksBox.classList.add("smaller");

    // Hide all sections and set their content's opacity to 0
    document.querySelectorAll(".section").forEach((sec) => {
      sec.style.display = "none";
      sec.querySelector(".content").style.opacity = "0";
    });

    // Display the clicked section and gradually increase its content's opacity
    section.style.display = "block";
    setTimeout(function () {
      content.style.opacity = "1";
    }, 50); // Timeout for the browser to recognize the display change

    // Show the page element
    page.style.display = "block";

    // Update the address bar to reflect the clicked link
    history.pushState(null, null, this.getAttribute("href"));
  });
});
