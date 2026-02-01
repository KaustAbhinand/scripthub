create table users (
    user_id serial primary key,
    username varchar(50) unique not null,
    email varchar(100) unique not null,
    password_hash text not null,
    registered_at timestamp default current_timestamp
);