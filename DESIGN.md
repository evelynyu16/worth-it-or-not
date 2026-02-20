# Worth It or Not — Design Document

Author: Zihan Guo, Fanchao Yu  
Course: CS5610 Web Development  
Instructor: John Alexis Guerra Gomez

---

# Project Description

Worth It or Not is a student-focused purchase reflection web application.

Students often buy products based on expectations, hype, or trends, but later discover the product was not as useful as expected.

This system allows students to:

• Share their purchase experiences  
• Compare expectation vs reality  
• Upload images  
• Learn from other students  
• Track their purchase history  

The goal of the system is to help students make smarter purchasing decisions.

---

# System Architecture

The system follows a:

Client → Server → Database

architecture.

---

# Client

Technologies:

• HTML5  
• CSS3 Modules  
• Vanilla JavaScript (ES6 Modules)

Responsibilities:

• Render posts  
• Submit posts  
• Upload images  
• Display profiles  
• Filter posts  
• Pagination  

Client is served as static files by Express.

---

# Server

Technologies:

• Node.js  
• Express.js  

Responsibilities:

• Provide REST API  
• Handle CRUD operations  
• Handle image upload  
• Serve static frontend  

Routes:

GET /api/posts

POST /api/posts

PUT /api/posts/:id

DELETE /api/posts/:id

GET /api/profiles

POST /api/profiles

POST /api/upload

GET /api/health

---

# Database

Technology:

MongoDB (Native Driver, not Mongoose)

Collections:

---

## profiles

Fields:

_id

nickname

createdAt

---

## posts

Fields:

_id

itemName

category

expectation

reality

sentiment

profileId

imageUrl

createdAt

updatedAt

---

Relationship:

posts.profileId → profiles._id

---

# Image Storage

Images are stored locally in:

server/uploads/

Images are served via:

/uploads/filename.jpg

---

# Frontend Structure

client/

index.html

app.js

api.js

utils.js

pages/

home.js

submit.js

profile.js

styles/

base.css

layout.css

nav.css

cards.css

forms.css

modals.css

home.css

---

# Backend Structure

server/

src/

app.js

db.js

routes/

posts.routes.js

profiles.routes.js

upload.routes.js

uploads/

seed.js

---

# REST API Design

GET /api/posts

Returns paginated posts

---

POST /api/posts

Creates new post

---

PUT /api/posts/:id

Updates post

---

DELETE /api/posts/:id

Deletes post

---

GET /api/profiles

Returns profiles

---

POST /api/profiles

Creates profile

---

POST /api/upload

Uploads image

---

GET /api/health

Server health check

---

# Seed System

Seed script:

server/seed.js

Creates:

• profiles  
• posts  

Supports:

SEED_POSTS=1200

This satisfies project requirement of database containing more than 1000 records.

---

# User Personas

---

## Persona 1 — Budget-Conscious Student

Name: Alex  
Age: 21  
Major: Computer Science  

Problem:

Alex has limited money and wants to avoid wasting money.

Goals:

• Learn from other students  
• Avoid regret purchases  

---

## Persona 2 — New Student

Name: Emily  
Age: 18  
Major: Biology  

Problem:

Emily doesn't know which products are useful.

Goals:

• Discover useful products  
• Learn from others  

---

# User Stories

---

## User Story 1 — Browse Posts

As a student,

I want to browse purchase reflections,

So that I can learn from others.

Implementation:

GET /api/posts

Page:

Home

---

## User Story 2 — Submit Post

As a student,

I want to submit a purchase experience,

So that I can share whether an item was worth it.

Implementation:

POST /api/posts

POST /api/upload

Page:

Submit

---

## User Story 3 — View Profile

As a student,

I want to view my posts,

So that I can track my purchase history.

Implementation:

GET /api/profiles

Page:

Profile

---

## User Story 4 — Filter Posts

As a student,

I want to filter posts by category,

So that I can find relevant items.

Implementation:

GET /api/posts?category=Tech

Page:

Home

---

# Design Mockups

---

## Home Page

Features:

• View posts  
• Filter posts  
• Pagination  
• Edit/Delete posts  
• Image display  

Screenshot:

(Add screenshot here)

---

## Submit Page

Features:

• Submit form  
• Upload image  
• Preview image  

Screenshot:

(Add screenshot here)

---

## Profile Page

Features:

• View user posts  
• Profile creation  

Screenshot:

(Add screenshot here)

---

# Design Decisions

Vanilla JS instead of React

Reason:

Course requirement to use vanilla JavaScript

---

MongoDB Native Driver instead of Mongoose

Reason:

Course requirement prohibits Mongoose

---

Disk storage instead of cloud storage

Reason:

Simpler implementation  
Sufficient for project scope  

---

Pagination system implemented

Reason:

Improve performance and usability with large dataset

---

# Security

Sensitive data stored in:

.env

.env is not committed to GitHub

.gitignore protects:

.env

node_modules

uploads

---

# Conclusion

Worth It or Not is a complete full-stack web application.

It provides:

• REST API  
• MongoDB database  
• Profile system  
• Image upload  
• Pagination  
• Filtering  
• CRUD functionality  

The system meets all project requirements.