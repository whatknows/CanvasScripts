# Creates a CSV file that lists every student in a class and what group they are in.

import csv 
from canvasapi import Canvas

# Canvas API URL
API_URL = "https://canvas.colorado.edu/"
# Canvas API key
API_KEY = "KEY GOES HERE"

# Initialize a new Canvas object
canvas = Canvas(API_URL, API_KEY)

# Grab course
course = canvas.get_course(85391)

# Grab groups
# groups = course.get_groups()

# Grab students
# students = course.get_users()

# Store records here
data = []

# For each group, get members, and add them to data
for g in course.get_groups():
    for m in g.get_memberships():
        u = course.get_user(m.user_id)
        data.append([g.name, u.name])

# Create CSV file
header = ['Group Name', 'Student Name']

with open('groups.csv', 'w', encoding='UTF8') as f:
    writer = csv.writer(f)
    # write the header
    writer.writerow(header)
    # write the data
    writer.writerows(data)
