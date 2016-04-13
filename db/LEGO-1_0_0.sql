-- phpMyAdmin SQL Dump
-- version 3.4.11.1deb2+deb7u1
-- http://www.phpmyadmin.net
--
-- Client: localhost
-- Généré le: Mer 13 Avril 2016 à 04:13
-- Version du serveur: 5.5.40
-- Version de PHP: 5.4.34-0+deb7u1

SET SQL_MODE="NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;

--
-- Base de données: `LEGO`
--

-- --------------------------------------------------------

--
-- Structure de la table `LEGO_elementCache`
--

CREATE TABLE IF NOT EXISTS `LEGO_elementCache` (
  `elementID` int(10) unsigned NOT NULL,
  `DesignId` mediumint(8) unsigned NOT NULL,
  `ItemDescr` varchar(255) NOT NULL DEFAULT '',
  `cachedOn` int(11) unsigned NOT NULL DEFAULT '0',
  `Asset` varchar(255) NOT NULL DEFAULT '',
  `ColourDescr` varchar(255) NOT NULL DEFAULT '',
  PRIMARY KEY (`elementID`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Contenu de la table `LEGO_elementCache`
--


-- --------------------------------------------------------

--
-- Structure de la table `LEGO_listElements`
--

CREATE TABLE IF NOT EXISTS `LEGO_listElements` (
  `ID` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `listID` int(11) unsigned NOT NULL,
  `elementID` int(15) unsigned NOT NULL,
  `qte` mediumint(8) unsigned NOT NULL,
  PRIMARY KEY (`ID`),
  KEY `INDEX` (`listID`),
  KEY `elementID` (`elementID`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=1820 ;

--
-- Contenu de la table `LEGO_listElements`
--



-- --------------------------------------------------------

--
-- Structure de la table `LEGO_userlists`
--

CREATE TABLE IF NOT EXISTS `LEGO_userlists` (
  `ID` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` mediumint(8) unsigned NOT NULL,
  `listName` varchar(255) NOT NULL DEFAULT '',
  `createdOn` int(11) unsigned NOT NULL DEFAULT '0',
  `asset` text NOT NULL,
  PRIMARY KEY (`ID`),
  KEY `user_id` (`user_id`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=54 ;

--
-- Contenu de la table `LEGO_userlists`
--



-- --------------------------------------------------------

--
-- Structure de la table `LEGO_users`
--

CREATE TABLE IF NOT EXISTS `LEGO_users` (
  `user_id` mediumint(8) unsigned NOT NULL AUTO_INCREMENT,
  `username` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `registerdate` int(11) unsigned NOT NULL,
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `UNIQUE` (`email`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=3 ;

--
-- Contenu de la table `LEGO_users`
--


--
-- Contraintes pour les tables exportées
--

--
-- Contraintes pour la table `LEGO_listElements`
--
ALTER TABLE `LEGO_listElements`
  ADD CONSTRAINT `LEGO_listElements_ibfk_1` FOREIGN KEY (`listID`) REFERENCES `LEGO_userlists` (`ID`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Contraintes pour la table `LEGO_userlists`
--
ALTER TABLE `LEGO_userlists`
  ADD CONSTRAINT `LEGO_userlists_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `LEGO_users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
