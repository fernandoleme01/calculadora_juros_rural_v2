CREATE TABLE `cadeia_contratos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`nome` varchar(255) NOT NULL,
	`banco` varchar(255) NOT NULL,
	`descricao` text,
	`laudoGerado` text,
	`laudoGeradoEm` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `cadeia_contratos_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `contratos_cadeia` (
	`id` int AUTO_INCREMENT NOT NULL,
	`cadeiaId` int NOT NULL,
	`ordem` int NOT NULL,
	`tipo` enum('original','aditivo','refinanciamento','novacao','renegociacao') NOT NULL,
	`numeroContrato` varchar(100) NOT NULL,
	`dataContratacao` varchar(20) NOT NULL,
	`dataVencimento` varchar(20) NOT NULL,
	`modalidade` enum('custeio','investimento','comercializacao','outro') NOT NULL,
	`valorContrato` decimal(18,2) NOT NULL,
	`valorPrincipalOriginal` decimal(18,2),
	`valorEncargosIncorporados` decimal(18,2),
	`taxaJurosAnual` decimal(8,4) NOT NULL,
	`taxaJurosMora` decimal(8,4),
	`numeroParcelas` int,
	`sistemaAmortizacao` enum('price','sac','saf','outro'),
	`garantias` text,
	`observacoes` text,
	`alertasDetectados` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `contratos_cadeia_id` PRIMARY KEY(`id`)
);
