# VWatch API Flow Guide: Visual Flows & Explanations

This document describes the 3 core backend flows of the **YouTube Watch Party (VWatch)** system using clear diagrams and step-by-step breakdowns. Use this guide to easily explain the code logic in technical interviews.

---

## 1. Flow A: 5 Users Joining the Party

This flow demonstrates what happens when **User A** (Room Creator) and 4 subsequent users (**User B, C, D, E**) join a watch room (`room-101`).

### Sequence Diagram

```mermaid
sequenceDiagram
    autonumber
    actor A as User A (Creator)
    actor B as User B (New User)
    actor C as User C (Mod returning)
    participant Server as Socket.io Server
    participant Cache as Room RAM Cache
    participant DB as MySQL DB

    Note over A, DB: User A joins (First connection)
    A->>Server: join_room (room-101)
    Server->>Cache: Look up room-101 (Not found)
    Server->>DB: Get room details (hostId = User A)
    Server->>Cache: Initialize Room object in RAM
    Server->>Server: Compare: hostId === User A? (Yes)
    Server->>DB: Set User A status to ACTIVE
    Server->>Cache: Add User A as HOST
    Server->>A: Emit user_joined (Playback State + active list)

    Note over B, DB: User B joins (New participant)
    B->>Server: join_room (room-101)
    Server->>Cache: Look up room-101 (Found in RAM)
    Server->>Server: Compare: hostId === User B? (No)
    Server->>DB: Query saved role (No record)
    Server->>DB: Save new participant (Role: PARTICIPANT, Status: ACTIVE)
    Server->>Cache: Add User B as PARTICIPANT
    Server->>B: Emit user_joined (State + [A, B])
    Server->>A: Broadcast participants_updated

    Note over C, DB: User C joins (Returning Moderator)
    C->>Server: join_room (room-101)
    Server->>Cache: Look up room-101 (Found)
    Server->>Server: Compare: hostId === User C? (No)
    Server->>DB: Query saved role (Found: MODERATOR)
    Server->>DB: Update status to ACTIVE
    Server->>Cache: Add User C as MODERATOR
    Server->>C: Emit user_joined (State + [A, B, C])
    Server->>A: Broadcast participants_updated
    Server->>B: Broadcast participants_updated
```

### Explanations:
* **User A (Host)**: Because User A is the room creator, the backend initializes the room in RAM cache, sets User A's role as `HOST` in memory, and sets their database status to `ACTIVE`.
* **User B (New Participant)**: The room already exists in RAM. Since User B is new, no DB participant record exists. The system creates a new entry with the default `PARTICIPANT` role, updates memory, and broadcasts the new active list to User A.
* **User C (Returning Moderator)**: User C was previously promoted to moderator. The DB has this saved. When User C joins, the backend fetches the role `MODERATOR` from MySQL, adds them to memory, and broadcasts the update to everyone else.

---

## 2. Flow B: User B Creating & Owning a Room

This flow shows how a non-host user (like User B) registers, logs in, and starts their own separate room, becoming the Host.

### Flowchart

```mermaid
graph TD
    UserB[User B] -->|1. POST /signup| SignUp[DB registers User B]
    UserB -->|2. POST /login| LogIn[JWT Token Returned]
    UserB -->|3. POST /rooms with Token| CreateRoom[Create room-999 in DB]
    CreateRoom -->|Save hostId = User B| DB[(MySQL Database)]
    UserB -->|4. Emit join_room room-999| SocketServer[Socket.io Server]
    SocketServer -->|5. Compare user.id with hostId| Match{Is Match?}
    Match -->|Yes| AssignHost[Assign HOST Role in RAM]
    Match -->|No| AssignGuest[Assign PARTICIPANT Role]
```

### Explanations:
1. **Registration & Login**: User B signs up and logs in. A JWT token is generated containing User B's ID.
2. **Room Creation**: User B sends an HTTP POST request to `/api/v1/rooms`. The server creates `room-999` in the database, setting the `hostId` column to User B's ID.
3. **Room Connection**: User B connects to the socket and sends `join_room` for `room-999`. 
4. **Role Assignment**: The backend compares the user's socket ID info (`User B`) with the database `hostId` (`User B`). Because they match, User B is initialized as the **`HOST`** in `room-999` with full controller rights.

---

## 3. Flow C: Host Promoting a Participant to Moderator

This flow shows how the Host (User A) changes the role of User B to a Moderator during a live session.

### Sequence Diagram

```mermaid
sequenceDiagram
    autonumber
    actor Host as User A (Host)
    participant Server as Socket.io Server
    participant Cache as Room RAM Cache
    participant DB as MySQL DB
    actor Target as User B (Participant)

    Host->>Server: Emit assign_role (target: User B, role: MODERATOR)
    Server->>Cache: Verify sender role is HOST (Yes)
    Server->>Cache: Verify User B is online in room (Yes)
    Server->>Cache: Update User B's role to MODERATOR in RAM
    Server->>DB: Update Participants table (role = MODERATOR)
    Server->>Host: Broadcast role_assigned (target: User B, role: MODERATOR)
    Server->>Target: Broadcast role_assigned (target: User B, role: MODERATOR)
    Note over Target: UI unlocks video controls<br/>(Play/Pause/Seek)
```

### Explanations:
1. **Initiation**: The Host selects User B in the UI and clicks "Make Moderator". The frontend sends the `assign_role` event.
2. **Validation**: The server verifies that the sender is the `HOST` of the active room, and that User B is present in the cache.
3. **Updates**: The server updates User B's role in the RAM cache (immediate effect) and runs an `UPDATE` query on the `Participants` table in MySQL (persistent storage).
4. **Sync**: The server broadcasts `role_assigned` to everyone in the room. The frontend updates the player controls to let the new Moderator play/pause/seek.
