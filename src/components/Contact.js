import React from "react";
import emailjs from "emailjs-com";
import { Container, Row, Col, Card, Form, Button } from "react-bootstrap";
import Typewriter from "typewriter-effect";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEnvelope, faPhone } from "@fortawesome/free-solid-svg-icons";
import {
  faLinkedin,
  faWhatsapp,
  faTelegram,
} from "@fortawesome/free-brands-svg-icons";
import "bootstrap/dist/css/bootstrap.min.css";

function Contact() {
  // Define contact details as arrays to be joined later
  const email = ["aamik", "users.noreply.github.com"];
  const phone = ["+358", "45", "6314659"];
  const linkedin = ["https://fi.linkedin.com"];
  const whatsapp = ["+358", "45", "6314659"];
  const telegram = ["harjar"];

  // Function to handle form submission and send email using emailjs service
  const sendForm = (event) => {
    event.preventDefault();

    emailjs
      .sendForm(
        "service_u4ml38w",
        "My Default Template",
        event.target,
        "5QXdTCGmzZH0zb-JF"
      )
      .then(
        (result) => {
          console.log(result.text);
        },
        (error) => {
          console.log(error.text);
        }
      );
  };

  // Render contact form and contact details with links
  return (
    <main className="vh-100 overflow-auto">
      <header className="container my-5">
        <div className="font-weight-bold mb-2"></div>
        <Typewriter
          onInit={(typewriter) => {
            typewriter
              .typeString(
                "Feel free to reach out to me! I am always open to collaborations. You can contact me through any method that suits you best."
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
            <Col sm={12}>
              <article>
                <Card className="form-card" style={{ animationDelay: "1s" }}>
                  <Card.Body className="text-center">
                    <Form onSubmit={sendForm}>
                      <Form.Group controlId="formBasicEmail">
                        <Form.Label>Email address</Form.Label>
                        <Form.Control type="email" placeholder="Enter email" />
                      </Form.Group>
                      <Form.Group controlId="formBasicName">
                        <Form.Label>Name</Form.Label>
                        <Form.Control
                          type="text"
                          placeholder="Enter your name"
                        />
                      </Form.Group>
                      <Form.Group controlId="formBasicMessage">
                        <Form.Label>Message</Form.Label>
                        <Form.Control
                          as="textarea"
                          rows={3}
                          placeholder="Enter your message"
                        />
                      </Form.Group>
                      <Button variant="primary" type="submit">
                        Submit
                      </Button>
                    </Form>
                  </Card.Body>
                </Card>
              </article>
            </Col>
          </Row>
        </Container>
      </section>
      <section>
        <Container>
          <Row className="mb-5">
            <Col xs={12} sm={6} md={4} lg={2}>
              <article>
                <Card
                  className="fade-in-card square-card"
                  style={{ animationDelay: "1.3s" }}
                >
                  <Card.Body className="text-center">
                    <a href={`mailto:${email.join("@")}`} className="icon-link">
                      <FontAwesomeIcon
                        icon={faEnvelope}
                        size="3x"
                        color="rgb(15, 237, 15)"
                      />
                    </a>
                  </Card.Body>
                </Card>
              </article>
            </Col>
            <Col xs={12} sm={6} md={4} lg={2}>
              <article>
                <Card
                  className="fade-in-card square-card"
                  style={{ animationDelay: "1.6s" }}
                >
                  <Card.Body className="text-center">
                    <a href={`tel:${phone.join("")}`} className="icon-link">
                      <FontAwesomeIcon
                        icon={faPhone}
                        size="3x"
                        color="rgb(15, 237, 15)"
                      />
                    </a>
                  </Card.Body>
                </Card>
              </article>
            </Col>
            <Col xs={12} sm={6} md={4} lg={2}>
              <article>
                <Card
                  className="fade-in-card square-card"
                  style={{ animationDelay: "1.9s" }}
                >
                  <Card.Body className="text-center">
                    <a
                      href={linkedin[0]}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="icon-link"
                    >
                      <FontAwesomeIcon
                        icon={faLinkedin}
                        size="3x"
                        color="rgb(15, 237, 15)"
                      />
                    </a>
                  </Card.Body>
                </Card>
              </article>
            </Col>
            <Col xs={12} sm={6} md={4} lg={2}>
              <article>
                <Card
                  className="fade-in-card square-card"
                  style={{ animationDelay: "2.1s" }}
                >
                  <Card.Body className="text-center">
                    <a
                      href={`https://wa.me/${whatsapp.join("")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="icon-link"
                    >
                      <FontAwesomeIcon
                        icon={faWhatsapp}
                        size="3x"
                        color="rgb(15, 237, 15)"
                      />
                    </a>
                  </Card.Body>
                </Card>
              </article>
            </Col>
            <Col xs={12} sm={6} md={4} lg={2}>
              <article>
                <Card
                  className="fade-in-card square-card"
                  style={{ animationDelay: "2.4s" }}
                >
                  <Card.Body className="text-center">
                    <a
                      href={`https://t.me/${telegram[0]}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="icon-link"
                    >
                      <FontAwesomeIcon
                        icon={faTelegram}
                        size="3x"
                        color="rgb(15, 237, 15)"
                      />
                    </a>
                  </Card.Body>
                </Card>
              </article>
            </Col>
          </Row>
        </Container>
      </section>
    </main>
  );
}

export default Contact;
