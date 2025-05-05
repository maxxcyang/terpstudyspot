const fs = require('fs');
const axios = require('axios');
const pLimit = require('p-limit');
const path = require('path');

const limit = pLimit(10);

const data = fs.readFileSync('courses.json', 'utf-8');
const courses = JSON.parse(data);

async function fetchWithRetry(course, retries = 3) {
  try {
    const response = await axios.get('https://api.umd.io/v1/courses/sections', {
      params: {
        course_id: course,
        semester: '202501'
      }
    });
    console.log(`Fetched from ${course}`);
    console.log(response.data);
    return response.data;
  } catch (error) {
    if (retries > 0) {
      console.warn(`Retrying ${course}... (${3 - retries + 1})`);
      return fetchWithRetry(course, retries - 1);
    } else {
      console.error(`Failed to fetch ${course} after 3 attempts:`, error.message);
      return null; // Mark as failed
    }
  }
}

const fetchWithLimit = course => limit(() => fetchWithRetry(course));

// Kick off all fetches
async function main() {
  try {
    const results = await Promise.allSettled(courses.map(fetchWithLimit));

    const successfulResults = results
      .filter(result => result.status === 'fulfilled' && result.value !== null)
      .map(result => result.value);

    fs.writeFileSync('sections.json', JSON.stringify(successfulResults, null, 2));
    console.log(`Successfully saved ${successfulResults.length} course sections to sections.json.`);
  } catch (error) {
    console.error('Unexpected error during fetching:', error);
  }
}

const filePath = path.join(__dirname, 'sections.json');

fs.readFile(filePath, 'utf8', (err, jsonString) => {
  if (err) {
    console.error("Error reading file:", err);
    return;
  }

  try {
    const data = JSON.parse(jsonString);

    const courseToInstructors = {};

    data.forEach(innerList => {
      innerList.forEach(section => {
        const course = section.course;
        const instructors = section.instructors || [];

        if (!courseToInstructors[course]) {
          courseToInstructors[course] = new Set();
        }

        // Join co-instructors in a section with " & ", even if it's just one
        const joined = instructors.join(" & ").trim();
        if (joined) {
          courseToInstructors[course].add(joined);
        }
      });
    });

    // Convert sets to arrays
    const result = {};
    for (const [course, instructorSet] of Object.entries(courseToInstructors)) {
      result[course] = [...instructorSet];
    }

    console.log(result);

    fs.writeFileSync(path.join(__dirname, 'course_and_instructors.json'), JSON.stringify(result, null, 2));

  } catch (err) {
    console.error("Error parsing JSON:", err);
  }
});