import React from "react";
import { Link } from "react-router-dom";
import Typewriter from "typewriter-effect";
import "bootstrap/dist/css/bootstrap.min.css";
import monitorImage from "../../src/images/monitor2.png";

function Home() {
  const projects = [
    {
      link: "https://github.com/aamik/titanicML",
      description: "Titanic Survivors: Machine learning model",
    },
    {
      link: "https://github.com/aamik/xo_ai",
      description: "Perfecting Tic-Tac-Toe: Reinforcement learning (WIP)",
    },
    {
      link: "https://github.com/aamik/",
      description: "Electricity spot price tracker",
    },
    {
      link: "https://github.com/aamik/",
      description: "Full stack travel app (TBA)",
    },

    {
      link: "https://github.com/aamik/",
      description: "More projects coming soon!",
    },

    // Easy to add more projects here
  ];

  return (
    <main className="overflow-auto">
      <header className="container my-5">
        <div className="font-weight-bold mb-2"></div>
        <Typewriter
          onInit={(typewriter) => {
            typewriter
              .typeString(
                "Welcome to my digital portfolio. This space is dedicated to the projects I’ve developed and contributed to. Feel free to explore!"
              )
              .start();
          }}
          options={{
            autoStart: true,
            loop: false,
            delay: 0.1,
            cursorClassName: "Typewriter__cursor text-danger",
            wrapperClassName: "Typewriter__wrapper h2",
          }}
        />
        <div className="row intro">
          <div className="col-12">
            <div className="mt-4 large-text">
              <p>
                My name is Aapo Mikkola, a computer science student. My passion
                for computers has now become a conscientious academic and
                professional journey. I have a broad interest in the field, with
                a current academic focus on enhancing my proficiency in Data
                Science and Web development.
              </p>
              <br></br>
              <p>
                Let's connect! If you're interested in discussing opportunities
                or collaborations, don't hesitate to{" "}
                <Link to="/contact">reach out</Link>. Fully available in Finnish
                and English.
              </p>
            </div>
          </div>
        </div>
      </header>
      <nav id="links" className="section container my-5">
        <h2 className="project-heading">My Projects</h2>
        <div className="row">
          {projects.map((project, i) => (
            <article className="col-md-4 mb-4" key={i}>
              <a
                href={project.link}
                target="_blank"
                rel="noopener noreferrer"
                className="project-link"
              >
                <figure>
                  <img
                    src={monitorImage}
                    alt="alt=Monitor by Clker-Free-Vector-Images from Pixabay"
                    className="img-fluid project-image"
                    style={{ animationDelay: `${3 + i * 0.2}s` }}
                    onLoad={(e) => e.target.classList.add("loaded")}
                  />
                  <figcaption
                    className="overlay"
                    style={{ animationDelay: `${3 + i * 0.2}s` }}
                    onLoad={(e) => e.target.classList.add("loaded")}
                  >
                    <div className="text">{project.description}</div>
                  </figcaption>
                </figure>
              </a>
            </article>
          ))}
        </div>
      </nav>
    </main>
  );
}

export default Home;
