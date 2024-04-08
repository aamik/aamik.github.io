import React from "react";
import { Container, Row, Col, Card } from "react-bootstrap";
import { useMediaQuery } from "react-responsive";
import "react-multi-carousel/lib/styles.css";
import Typewriter from "typewriter-effect";
import "bootstrap/dist/css/bootstrap.min.css";

/* Importing like this makes building easier */
import badmBig from "../images/badm_big.jpg";
import badmSmall from "../images/badm_small.jpg";
import italyBig from "../images/italy_big.jpg";
import italySmall from "../images/italy_small.jpg";
import bikeBig from "../images/bike_big.png";
import bikeSmall from "../images/bike_small.png";
import skiBig from "../images/ski_big.png";
import skiSmall from "../images/ski_small.png";
import trekBig from "../images/trek_big.png";
import trekSmall from "../images/trek_small.png";

function About() {
  // useMediaQuery to determine if device is desktop or laptop
  const isDesktopOrLaptop = useMediaQuery({
    query: "(min-device-width: 1224px)",
  });

  return (
    <main className="overflow-auto">
      <header className="container my-5">
        <div className="font-weight-bold mb-2"></div>
        <Typewriter
          onInit={(typewriter) => {
            typewriter
              .typeString(
                "My educational background, professional journey, and the passions that fuel my creativity outside of work."
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
      </header>
      <section>
        <Container>
          <Row className="mb-5">
            <Col>
              <article>
                <Card className="fade-in-card" style={{ animationDelay: "1s" }}>
                  <Card.Body>
                    <Card.Title>Education</Card.Title>
                    <Card.Text>
                      <a href="https://www.google.fi">
                        Master of Science: Cell and Molecular Biology
                        (University of Jyväskylä 2021)
                      </a>
                    </Card.Text>
                    <Card.Text>
                      <a href="https://www.google.fi">
                        Ongoing studies in Computer Science
                      </a>
                    </Card.Text>
                  </Card.Body>
                </Card>
              </article>
            </Col>
          </Row>
          <Row className="mb-5">
            <Col>
              <article>
                <Card
                  className="fade-in-card"
                  style={{ animationDelay: "1.5s" }}
                >
                  <Card.Body>
                    <Card.Title>Experience</Card.Title>
                    <Card.Text>
                      {" "}
                      <a href="https://www.google.fi">TBA</a>
                    </Card.Text>
                  </Card.Body>
                </Card>
              </article>
            </Col>
          </Row>
          <Row className="mb-5">
            <Col>
              <article>
                <Card className="fade-in-card" style={{ animationDelay: "2s" }}>
                  <Card.Body>
                    <Card.Title>Certificates</Card.Title>
                    <Card.Text>
                      <a href="https://www.google.fi">AWS Certificate</a>
                    </Card.Text>
                  </Card.Body>
                </Card>
              </article>
            </Col>
          </Row>
        </Container>
      </section>
      <section className="imagesection">
        <Container>
          <h2>Few of my interests</h2>
          <div className="image-row">
            <a href={badmBig} target="_blank" rel="noopener noreferrer">
              <img
                src={isDesktopOrLaptop ? badmBig : badmSmall}
                alt="Badminton"
              />
            </a>
            <a href={italyBig} target="_blank" rel="noopener noreferrer">
              <img
                src={isDesktopOrLaptop ? italyBig : italySmall}
                alt="Italy travel"
              />
            </a>
            <a href={bikeBig} target="_blank" rel="noopener noreferrer">
              <img
                src={isDesktopOrLaptop ? bikeBig : bikeSmall}
                alt="Biking in Ylläs"
              />
            </a>
            <a href={skiBig} target="_blank" rel="noopener noreferrer">
              <img
                src={isDesktopOrLaptop ? skiBig : skiSmall}
                alt="Winter skiing on the lake"
              />
            </a>
            <a href={trekBig} target="_blank" rel="noopener noreferrer">
              <img
                src={isDesktopOrLaptop ? trekBig : trekSmall}
                alt="Konnevesi National park"
              />
            </a>
          </div>
        </Container>
      </section>
    </main>
  );
}

export default About;
