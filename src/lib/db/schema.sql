-- FixiTN schema, mirrors prisma/schema.prisma table-for-table, column-for-column.
-- Booleans are stored as INTEGER 0/1 (SQLite has no native boolean).
-- JSON-ish list fields (photos, galleryImages, howItWorks, features) are stored
-- as TEXT containing a JSON-encoded string[].

CREATE TABLE IF NOT EXISTS User (
  id           TEXT PRIMARY KEY,
  fullName     TEXT NOT NULL,
  phone        TEXT NOT NULL UNIQUE,
  email        TEXT UNIQUE,
  passwordHash TEXT NOT NULL,
  role         TEXT NOT NULL,
  city         TEXT,
  address      TEXT,
  avatarUrl    TEXT,
  createdAt    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS Plan (
  id                  TEXT PRIMARY KEY,
  key                 TEXT NOT NULL UNIQUE,
  name                TEXT NOT NULL,
  price               INTEGER NOT NULL,
  billingCycle        TEXT NOT NULL,
  commissionRate      REAL NOT NULL,
  maxRequestsPerMonth INTEGER,
  priorityVisibility  INTEGER NOT NULL DEFAULT 0,
  features            TEXT NOT NULL,
  badge               TEXT
);

CREATE TABLE IF NOT EXISTS Technician (
  id              TEXT PRIMARY KEY,
  userId          TEXT NOT NULL UNIQUE REFERENCES User(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  bio             TEXT,
  yearsExperience INTEGER NOT NULL DEFAULT 0,
  startingPrice   INTEGER NOT NULL DEFAULT 0,
  latitude        REAL NOT NULL DEFAULT 36.8065,
  longitude       REAL NOT NULL DEFAULT 10.1815,
  verified        INTEGER NOT NULL DEFAULT 0,
  galleryImages   TEXT,
  planId          TEXT REFERENCES Plan(id),
  createdAt       TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS Category (
  id          TEXT PRIMARY KEY,
  slug        TEXT NOT NULL UNIQUE,
  name        TEXT NOT NULL,
  icon        TEXT NOT NULL,
  color       TEXT NOT NULL,
  description TEXT,
  howItWorks  TEXT,
  videoUrl    TEXT,
  ratingAvg   REAL,
  ratingCount INTEGER,
  sortOrder   INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS TechnicianCategory (
  technicianId TEXT NOT NULL REFERENCES Technician(id) ON DELETE CASCADE,
  categoryId   TEXT NOT NULL REFERENCES Category(id) ON DELETE CASCADE,
  PRIMARY KEY (technicianId, categoryId)
);

CREATE TABLE IF NOT EXISTS ServiceRequest (
  id           TEXT PRIMARY KEY,
  clientId     TEXT NOT NULL REFERENCES User(id),
  technicianId TEXT NOT NULL REFERENCES Technician(id),
  categoryId   TEXT NOT NULL REFERENCES Category(id),

  fullName    TEXT NOT NULL,
  phone       TEXT NOT NULL,
  address     TEXT NOT NULL,
  latitude    REAL,
  longitude   REAL,
  description TEXT NOT NULL,
  photos      TEXT,

  status                 TEXT NOT NULL DEFAULT 'PENDING',
  clientConfirmedSolved  INTEGER,

  pendingAt    TEXT NOT NULL DEFAULT (datetime('now')),
  acceptedAt   TEXT,
  onTheWayAt   TEXT,
  arrivedAt    TEXT,
  inProgressAt TEXT,
  completedAt  TEXT,
  declinedAt   TEXT,
  cancelledAt  TEXT,

  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS Message (
  id        TEXT PRIMARY KEY,
  requestId TEXT NOT NULL REFERENCES ServiceRequest(id) ON DELETE CASCADE,
  senderId  TEXT NOT NULL REFERENCES User(id),
  body      TEXT,
  imageUrl  TEXT,
  createdAt TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS Review (
  id           TEXT PRIMARY KEY,
  requestId    TEXT NOT NULL UNIQUE REFERENCES ServiceRequest(id),
  technicianId TEXT NOT NULL REFERENCES Technician(id),
  authorId     TEXT NOT NULL REFERENCES User(id),
  rating       INTEGER NOT NULL,
  comment      TEXT,
  createdAt    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS Subscription (
  id           TEXT PRIMARY KEY,
  technicianId TEXT NOT NULL REFERENCES Technician(id),
  planId       TEXT NOT NULL REFERENCES Plan(id),
  startedAt    TEXT NOT NULL DEFAULT (datetime('now')),
  expiresAt    TEXT,
  status       TEXT NOT NULL DEFAULT 'ACTIVE'
);

CREATE TABLE IF NOT EXISTS Payment (
  id           TEXT PRIMARY KEY,
  technicianId TEXT NOT NULL REFERENCES Technician(id),
  requestId    TEXT UNIQUE REFERENCES ServiceRequest(id),
  amount       INTEGER NOT NULL,
  platformFee  INTEGER NOT NULL DEFAULT 0,
  method       TEXT NOT NULL,
  status       TEXT NOT NULL DEFAULT 'PAID',
  type         TEXT NOT NULL,
  createdAt    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS Notification (
  id        TEXT PRIMARY KEY,
  userId    TEXT NOT NULL REFERENCES User(id) ON DELETE CASCADE,
  type      TEXT NOT NULL,
  title     TEXT NOT NULL,
  body      TEXT,
  requestId TEXT,
  read      INTEGER NOT NULL DEFAULT 0,
  createdAt TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_technician_user ON Technician(userId);
CREATE INDEX IF NOT EXISTS idx_request_client ON ServiceRequest(clientId);
CREATE INDEX IF NOT EXISTS idx_request_technician ON ServiceRequest(technicianId);
CREATE INDEX IF NOT EXISTS idx_request_category ON ServiceRequest(categoryId);
CREATE INDEX IF NOT EXISTS idx_message_request ON Message(requestId);
CREATE INDEX IF NOT EXISTS idx_notification_user ON Notification(userId, read);
CREATE INDEX IF NOT EXISTS idx_review_technician ON Review(technicianId);
CREATE INDEX IF NOT EXISTS idx_payment_technician ON Payment(technicianId);