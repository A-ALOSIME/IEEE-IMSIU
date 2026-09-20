CREATE TABLE records (
 kind TEXT NOT NULL CHECK(kind IN ('events','registrations','cycles','applications','members','committees','hours','articles','announcements','team','dispatches','redirects','clubLeadership')),
 id TEXT NOT NULL,
 payload TEXT NOT NULL CHECK(json_valid(payload) AND json_extract(payload,'$.id')=id),
 updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 PRIMARY KEY(kind,id)
);
CREATE UNIQUE INDEX member_email ON records(lower(json_extract(payload,'$.email'))) WHERE kind='members';
CREATE UNIQUE INDEX team_email ON records(lower(json_extract(payload,'$.email'))) WHERE kind='team';
CREATE UNIQUE INDEX event_email ON records(json_extract(payload,'$.event'),lower(json_extract(payload,'$.email'))) WHERE kind='registrations';
CREATE UNIQUE INDEX application_email ON records(json_extract(payload,'$.cycle'),lower(json_extract(payload,'$.email'))) WHERE kind='applications';
CREATE UNIQUE INDEX article_slug ON records(json_extract(payload,'$.slug')) WHERE kind='articles';
CREATE UNIQUE INDEX redirect_slug ON records(json_extract(payload,'$.slug')) WHERE kind='redirects';
CREATE INDEX records_status ON records(kind,json_extract(payload,'$.status'));
CREATE TABLE revisions(version INTEGER PRIMARY KEY, actor TEXT NOT NULL, created_at TEXT DEFAULT CURRENT_TIMESTAMP);
INSERT INTO revisions(version,actor) VALUES(0,'migration');
CREATE TABLE uploads(id TEXT PRIMARY KEY,key TEXT UNIQUE NOT NULL,scope TEXT NOT NULL,mime TEXT NOT NULL,size INTEGER NOT NULL,owner TEXT NOT NULL,created_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE rate_limits(key TEXT PRIMARY KEY,hits INTEGER NOT NULL,expires INTEGER NOT NULL);
INSERT INTO records(kind,id,payload) VALUES
 ('committees','activities','{"id":"activities","title":"لجنة الأنشطة","description":"تنظيم الفعاليات والورش"}'),
 ('committees','media','{"id":"media","title":"لجنة الإعلام","description":"التغطيات والمحتوى المرئي"}'),
 ('committees','content','{"id":"content","title":"لجنة المحتوى والتطوير","description":"المحتوى المعرفي والتطوير"}'),
 ('committees','hr','{"id":"hr","title":"لجنة الموارد البشرية","description":"العضوية وتنظيم الفريق"}'),
 ('clubLeadership','club','{"id":"club","leader":"","leaderRole":"قائد","deputy":"","deputyRole":"نائب"}');
