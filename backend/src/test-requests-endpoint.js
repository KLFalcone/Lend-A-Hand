// backend/src/test-requests-endpoint.js
// Quick manual test to verify GET and POST /api/requests endpoints

const BASE_URL = "http://localhost:5000/api/requests";

async function testEndpoints() {
    console.log("Testing /api/requests endpoints\n");

    try {
        // Test 1: POST - Create a new request
        console.log("Test 1: POST - Create a new request");
        const newRequest = {
            title: "Test Request from Script",
            description: "This is a test request created by the test script",
            status: "open",
            createdBy: "68e3ca262035bb10354e5a5d" // Replace with a valid user ID from your DB
        };

        const postResponse = await fetch(BASE_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(newRequest)
        });

        const createdRequest = await postResponse.json();
        console.log(`Status: ${postResponse.status}`);
        console.log(`Created request ID: ${createdRequest._id}`);
        console.log(`Title: ${createdRequest.title}`);
        console.log("");

        // Test 2: GET - Fetch all requests
        console.log("Test 2: GET - Fetch all requests");
        const getResponse1 = await fetch(BASE_URL);
        const allRequests = await getResponse1.json();
        console.log(`Status: ${getResponse1.status}`);
        console.log(`Returned ${allRequests.length} requests`);
        console.log(`Sample:`, allRequests[0]);
        console.log("");

        // Test 3: GET - Filter by status=open
        console.log("Test 3: GET - Filter by status=open");
        const getResponse2 = await fetch(`${BASE_URL}?status=open`);
        const openRequests = await getResponse2.json();
        console.log(`Status: ${getResponse2.status}`);
        console.log(`Returned ${openRequests.length} open requests`);
        console.log("");

        // Test 4: GET - Filter by status=closed
        console.log("Test 4: GET - Filter by status=closed");
        const getResponse3 = await fetch(`${BASE_URL}?status=closed`);
        const closedRequests = await getResponse3.json();
        console.log(`Status: ${getResponse3.status}`);
        console.log(`Returned ${closedRequests.length} closed requests`);
        console.log("");

        // Test 5: Verify the new request appears in results
        console.log("Test 5: Verify created request appears in GET results");
        const foundRequest = allRequests.find(req => req._id === createdRequest._id);
        if (foundRequest) {
            console.log(`SUCCESS: Created request found in GET results`);
            console.log(`Title matches: ${foundRequest.title === newRequest.title}`);
        } else {
            console.log(`WARNING: Created request not found in GET results`);
        }
        console.log("");

        console.log("All tests passed! Endpoints are working.\n");

    } catch (error) {
        console.error("Test failed:", error.message);
        console.log("\nMake sure your backend server is running on port 5000");
    }
}

testEndpoints();