


CREATE DATABASE IF NOT EXISTS cleanus_db;


USE cleanus_db;

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(20) NOT NULL,
    password VARCHAR(255) NOT NULL, 
    street VARCHAR(255) NOT NULL,
    `number` VARCHAR(50) NOT NULL, 
    city VARCHAR(100) NOT NULL,
    zip_code VARCHAR(20),
    id_document_path VARCHAR(255) NOT NULL, 
    registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE IF NOT EXISTS services (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    service_date DATE NOT NULL,
    operator_count INT NOT NULL,
    service_days INT NOT NULL,
    total_cost DECIMAL(10, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending', 
    request_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE 
);


