import React from "react";

export default function Profile() {
  return (
    <>
      <div className="flex justify-center">
        <section className="m-4">
          <div>
            <img src="https://westernfinance.org/wp-content/uploads/speaker-3-v2.jpg"></img>
            <h3>Jonh Doe</h3>
            <p>Software Engineer</p>
            <button>Contact</button>
            <button>Resume</button>
          </div>
          <div>
            <h3>Skills</h3>
            <p>React</p>
            <p>Node.js</p>
            <p>JavaScript</p>
            <p>HTML</p>
            <p>CSS</p>
          </div>
        </section>
        <section className="m-4">
          <div>
            <h3>About Me</h3>
            <p>
              Hi there! I'm a software engineer with a passion for creating
              user-friendly and visually appealing web applications. I have
              experience working with various technologies such as React,
              Node.js, JavaScript, HTML, and CSS. I'm always looking to learn
              new things and collaborate with others to create innovative
              solutions.
            </p>
          </div>
          <div>
            <h3>Experienc</h3>
            <div>
              <h4>Software Engineer at Acme Inc. (2018 - Present)</h4>
              <p>
                Developed and maintained web applications using React, Node.js,
                and JavaScript.
              </p>
            </div>
            <div>
              <h4>Software Engineer at Acme Inc. (2018 - Present)</h4>
              <p>
                Developed and maintained web applications using React, Node.js,
                and JavaScript.
              </p>
            </div>
            <div>
              <h4>Software Engineer at Acme Inc. (2018 - Present)</h4>
              <p>
                Developed and maintained web applications using React, Node.js,
                and JavaScript.
              </p>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
