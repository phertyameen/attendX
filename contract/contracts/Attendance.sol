// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Attendance {
    struct Session {
        string name;
        uint timestamp;
        address instructor;
        uint totalStudents;
        uint attendanceCount;
    }

    uint public sessionCount;
    mapping(uint => Session) public sessions;

    // sessionId => student address => registered?
    mapping(uint => mapping(address => bool)) public registered;
    // sessionId => student address => checked in?
    mapping(uint => mapping(address => bool)) public attendance;

    event SessionCreated(uint sessionId, string name, address instructor);
    event StudentRegistered(uint sessionId, address student);
    event StudentCheckedIn(uint sessionId, address student);

    function createSession(string memory name) public returns (uint sessionId) {
        sessionId = sessionCount;
        sessions[sessionCount] = Session(name, block.timestamp, msg.sender, 0, 0);
        emit SessionCreated(sessionCount, name, msg.sender);
        sessionCount++;
    }

    function register(uint sessionId) public {
        require(!registered[sessionId][msg.sender], "Already registered");
        registered[sessionId][msg.sender] = true;
        sessions[sessionId].totalStudents++;
        emit StudentRegistered(sessionId, msg.sender);
    }

    function checkIn(uint sessionId) public {
        require(registered[sessionId][msg.sender], "Not registered");
        require(!attendance[sessionId][msg.sender], "Already checked in");

        attendance[sessionId][msg.sender] = true;
        sessions[sessionId].attendanceCount++;
        emit StudentCheckedIn(sessionId, msg.sender);
    }

    function hasCheckedIn(uint sessionId, address student) public view returns (bool) {
        return attendance[sessionId][student];
    }

    function isRegistered(uint sessionId, address student) public view returns (bool) {
        return registered[sessionId][student];
    }
}