CREATE TABLE `perfil_advogado` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`nome` varchar(255) NOT NULL,
	`oab` varchar(30) NOT NULL,
	`cpf` varchar(14),
	`email` varchar(320),
	`telefone` varchar(20),
	`escritorio` varchar(255),
	`endereco` varchar(255),
	`cidade` varchar(100),
	`estado` varchar(2),
	`cep` varchar(9),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `perfil_advogado_id` PRIMARY KEY(`id`),
	CONSTRAINT `perfil_advogado_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `perfil_perito` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`nome` varchar(255) NOT NULL,
	`categoria` enum('contador','economista','administrador','tecnico_contabil','outro') NOT NULL,
	`registroProfissional` varchar(50) NOT NULL,
	`cpf` varchar(14),
	`email` varchar(320),
	`telefone` varchar(20),
	`empresa` varchar(255),
	`endereco` varchar(255),
	`cidade` varchar(100),
	`estado` varchar(2),
	`cep` varchar(9),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `perfil_perito_id` PRIMARY KEY(`id`),
	CONSTRAINT `perfil_perito_userId_unique` UNIQUE(`userId`)
);
